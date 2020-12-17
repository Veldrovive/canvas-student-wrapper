import canvas from 'canvas-api-wrapper'

function toDate(str) {
    if (str == null) {
        return null
    } else {
        return new Date(str)
    }
}

class Course {
    constructor(params) {
        ({ 
            id: this.id, name: this.name, 
            startDate: this.startDate, 
            active: this.active, 
            code: this.code, 
            calendarLink: this.calendarLink,
            term: this.term,
            courseImg: this.courseImg,
            totalStudents: this.totalStudents,
            teachers: this.teachers,
            tabs: this.tabs
        } = params)
        this.permissions = {}
        this._announcements = {}
        this._assignments = {}
    }

    get announcements () {
        const a = Object.values(this._announcements)
        a.sort((a, b) => a.position - b.position)
        return a
    }

    get assignments () {
        const a = Object.values(this._assignments)
        a.sort((a, b) => a.position - b.position)
        return a
    }

    updatePermissons(permissions) {
        this.permissions = permissions
    }

    hasPermission(type) {
        if (this.permissions.hasOwnProperty(type)) {
            return this.permissions[type]
        } else {
            return false
        }
    }

    addAnnouncement(announcement) {
        /**
         * Checks if the announcement exists, if not it adds it.
         * Returns true if the announcement was just added and false if it already existed.
         */
        const {id, ...announcementObj} = announcement
        this._announcements[id] = announcementObj
        return !this._announcements.hasOwnProperty(id)
    }

    addAssignment(assignment) {
        const {id, ...assignmentObj} = assignment
        this._assignments[id] = assignmentObj
        return !this._assignments.hasOwnProperty(id)
    }

    toJSON() {
        const { id, name, startDate, active, code, calendarLink, term, courseImg, totalStudents, teachers, tabs } = this
        const data = {
            id, name, startDate, active, code, calendarLink, term, courseImg, totalStudents, teachers, tabs,
            announcements: this.announcements, assignments: this.assignments
        }
        return data
    }
}

export default class Canvas {
    constructor(accessToken, yearStartDate, subdomain = 'utoronto') {
        canvas.subdomain = subdomain
        canvas.apiToken = accessToken
        this.subdomain = subdomain
        this.yearStartDate = yearStartDate
        this.lastUpdate = null

        this.courses = {}
    }

    static async create(accessToken, yearStartDate, subdomain = 'utoronto') {
        const canvas = new Canvas(accessToken, yearStartDate, subdomain)
        canvas.lastUpdate = await canvas.update()
        return canvas
    }

    async update() {
        const newCourseCount = await this.updateCourseObjects()
        const newAnnoucementCount = await this.updateAnnouncements()
        const newAssignmentsCount = await this.updateAssignments()

        return { courses: newCourseCount, announcements: newAnnoucementCount, assignments: newAssignmentsCount }
    }

    async updateCourseObjects() {
        let newCount = 0
        const courses = await canvas('/api/v1/courses?include[]=term&include[]=course_image&include[]=total_students&include[]=teachers&include[]=tabs')
        for (const course of courses) {
            const { id, name, start_at, course_code: code, calendar: calendars, enrollments, term: termData, image_download_url: courseImg, total_students: totalStudents, teachers, tabs, permissions} = course
            const term = termData != null ? {
                name: termData.name,
                start: toDate(termData.start_at),
                end: toDate(termData.end_at)
            } : {name: null, start: undefined, end: undefined}
            const calendarLink = calendars != null ? calendars.ics : ''
            const startDate = toDate(start_at)
            const active = startDate >= this.yearStartDate

            const newCourse = new Course({
                id, name, startDate, active, code, enrollments, calendarLink, term, courseImg, totalStudents, teachers, tabs
            })

            if (this.courses.hasOwnProperty(id)) {
                continue
            } else {
                this.courses[id] = newCourse
                newCount += 1
            }
        }

        const courseIds = Object.keys(this.courses)
        const promises = []
        courseIds.forEach(async id => {
            const getPermissons = async courseId => {
                const permissions = await canvas(`/api/v1/courses/${courseId}/permissions`)
                this.courses[courseId].updatePermissons(permissions)
            }

            promises.push(getPermissons(id))
        })
        await Promise.allSettled(promises)
        return newCount
    }

    async updateAnnouncements() {
        let newCount = 0
        let contextCodes = ''
        for (const [id, course] of Object.entries(this.courses)) {
            if (course.hasPermission('read_announcements')) {
                if (contextCodes.length > 0) {
                    contextCodes += '&'
                }
                contextCodes += `context_codes[]=course_${id}`
            }
        }
        const announcements = await canvas(`/api/v1/announcements?start_date=${this.yearStartDate.toISOString()}&end_date=${(new Date()).toISOString()}&${contextCodes}`)
        for (const announcement of announcements) {
            const { id, position, title, message, posted_at: postedAt, read_state: readState, author: authorData, url: link, context_code: contextCode } = announcement
            const created = toDate(postedAt)
            const author = authorData != null ? {
                id: authorData.id, name: authorData.display_name, link: authorData.html_url
            } : {id: null, name: '', link: ''}
            const courseId = parseInt(contextCode.split('_')[1])
            const read = readState === 'read'
            newCount += this.courses[courseId].addAnnouncement({
                id, position, title, message, created, read, author, link
            })
        }
        return newCount
    }

    async updateAssignments () {
        let newCount = 0
        const promises = []
        const updateCourseAssignments = async courseId => {
            const assignments = await canvas(`/api/v1/courses/${courseId}/assignments?include[]=submission&include[]=score_statistics`)
            for (const assignment of assignments) {
                const { id, position, name, description, due_at: dueAt, unlock_at: unlockAt, omit_from_final_grade: doesNotCount, allowed_attempts: allowedAttempts, has_submitted_submissions: submitted, html_url: link, submission: submissionData, submissions_download_url: submissionDownload, points_possible: possiblePoints } = assignment
                const dueDate = toDate(dueAt)
                const unlockDate = toDate(unlockAt)
                const counts = !doesNotCount
                const submission = submissionData != null ? {
                    id: submissionData.id, grade: submissionData.grade, score: submissionData.score, possiblePoints, submissionDate: toDate(submissionData.submitted_at),
                    assignmentId: submissionData.assignment_id, graded: submissionData.workflow_state === 'graded', gradedDate: toDate(submissionData.graded_at),
                    late: submissionData.late, missing: submissionData.missing, download: submissionDownload, attachments: submissionData.attachments || []
                } : { id: null, grade: null, score: -1, submissionDate: undefined, assignmentId: null, graded: false, gradedDate: undefined, late: false, missing: false, download: null, attachments: [] }
                newCount += this.courses[courseId].addAssignment({
                    id, position, name, description, dueDate, unlockDate, counts, allowedAttempts, submitted, link, submission
                })
            }
        }

        for (const [id, course] of Object.entries(this.courses)) {
            if (course.active && course.hasPermission('read_grades')) {
                promises.push(updateCourseAssignments(id))
            }
        }
        await Promise.allSettled(promises)

        return newCount
    }

    getCourses(params) {
        const {active=false, code} = params
        const validCourses = {}
        for (const [key, course] of Object.entries(this.courses)) {
            if (active && !course.active) {
                continue
            }

            if (code && !course.code.includes(code)) {
                continue
            }

            validCourses[key] = course
        }
        return validCourses
    }

    toJSON() {
        const { subdomain, yearStartDate, lastUpdate, courses } = this
        const data = {
            subdomain, yearStartDate, lastUpdate, courses
        }
        return data
    }
}