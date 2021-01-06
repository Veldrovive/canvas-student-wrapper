import createCanvasInterface from 'simple-canvas-interface'

function toDate(str) {
    if (str == null) {
        return null
    } else {
        return new Date(str)
    }
}
class Course {
    constructor (course) {
        this.data = this.parseCourse(course)
    }

    parseCourse (courseObj) {
        /**
         * Modifies the course object to have:
         * short_course_code - The shortened course code used by most other services. Eg: CHM136H1 F LEC0101 is guessed to be CHM136
         * is_lecture - Whether the name or course_code has the keyphrase LEC in it
         * permissions - A null value that will contain the course permissions once they are needed
         * announcements - An empty object that will contain the course announcements
         * assignments - An empty object that will contain the course assignments
         */
        const { course_code, name } = courseObj
        // We assume the code format will be the one outlined here https://politics.utoronto.ca/undergraduate/courses/codes/
        // We capture the code that is some uppercase letters followed by some digits followed by an H or Y followed by a number from 1 to 9.
        const short_course_code = (course_code.match(/[A-Z]+[0-9]+(?=[HY][1-9])/g) || [null])[0]
        courseObj['short_course_code'] = short_course_code

        // We assume that all lectures will have LEC somewhere in their name or code
        const is_lecture = name.includes('LEC') || course_code.includes('LEC')
        courseObj['is_lecture'] = is_lecture

        if (courseObj['permissions'] == null) {
            courseObj['permissions'] = null
        }
        if (courseObj['announcements'] == null) {
            courseObj['announcements'] = {}
            courseObj['announcementsUpdateDate'] = null
        }
        if (courseObj['assignments'] == null) {
            courseObj['assignments'] = {}
            courseObj['assignmentsUpdateDate'] = null
        }

        return courseObj
    }

    setAnnouncements (announcements) {
        for (const announcement of announcements) {
            const { id } = announcement
            this.data.announcements[id] = announcement
        }
        this.data.announcementUpatedDate = new Date()
    }

    get announcements () {
        if (this.data.announcements == null) {
            return null
        }
        const announcements = []
        for (const announcement of Object.values(this.data.announcements)) {
            let { id, title, message,  posted_at: date, position, read_state: readState, author: authorData, url: link } = announcement
            date = toDate(date)
            const read = readState === 'read'
            const author = authorData != null ? {
                id: authorData.id, name: authorData.display_name, link: authorData.html_url
            } : {id: null, name: '', link: ''}
            announcements.push({
                id, title, message, date, position, read, author, link
            })
        }
        announcements.sort((a, b) => a.position - b.position)
        return announcements
    }

    setAssignments (assignments) {
        for (const assignment of assignments) {
            const { id } = assignment
            this.data.assignments[id] = assignment
        }
        this.data.assignmentsUpdateDate = new Date()
    }

    get assignments () {
        if (this.data.assignments == null) {
            return null
        }
        const assignments = []
        for (const assignment of Object.values(this.data.assignments)) {
            let { id, position, name, description, due_at: dueAt, 
                unlock_at: unlockAt, omit_from_final_grade: doesNotCount, 
                allowed_attempts: allowedAttempts, has_submitted_submissions: submitted, 
                html_url: link, submission: submissionData, 
                submissions_download_url: submissionDownload, 
                points_possible: possiblePoints } = assignment
            const dueDate = toDate(dueAt)
            const unlockDate = toDate(unlockAt)
            const counts = !doesNotCount
            const submission = submissionData != null ? {
                id: submissionData.id, grade: submissionData.grade, score: submissionData.score, possiblePoints, submissionDate: toDate(submissionData.submitted_at),
                assignmentId: submissionData.assignment_id, graded: submissionData.workflow_state === 'graded', gradedDate: toDate(submissionData.graded_at),
                late: submissionData.late, missing: submissionData.missing, download: submissionDownload, attachments: submissionData.attachments || []
            } : { id: null, grade: null, score: -1, submissionDate: undefined, assignmentId: null, graded: false, gradedDate: undefined, late: false, missing: false, download: null, attachments: [] }
            assignments.push({
                id, possiblePoints, position, name, description, dueDate, unlockDate, counts, allowedAttempts, submitted, link, submission
            })
        }
        assignments.sort((a, b) => a.position - b.position)
        return assignments
    }

    get active () {
        return this.data.active
    }

    get code () {
        return this.data.short_course_code
    }

    get id () {
        return this.data.id
    }

    get startDate () {
        return toDate(this.data.start_at)
    }

    get name () {
        return this.data.name
    }

    get endDate () {
        return toDate(this.data.end_date)
    }

    get term () {
        return {
            name: this.data.term.name,
            startDate: toDate(this.data.term.start_at),
            endDate: toDate(this.data.term.end_at),
            active: this.data.term.workflow_state === 'active'
        }
    }

    get totalStudents () {
        return this.data.total_students
    }

    get teachers () {
        const teachers = []
        for (const teacher of this.data.teachers) {
            teachers.push({
                name: teacher.display_name,
                avatar: teacher.avatar_image_url,
                link: teacher.html_url
            })
        }
        return teachers
    }

    get tabs () {
        const tabs = []
        for (const tab of this.data.tabs) {
            tabs.push({
                id: tab.id,
                label: tab.label,
                position: tab.position,
                link: tab.full_url,
                type: tab.type
            })
        }
        return tabs
    }

    get calendarLink () {
        return this.data.calendar.ics
    }

    get courseImg () {
        return this.data.image_download_url
    }

    get isLecture () {
        return this.data.is_lecture
    }

    toJSON () {
        const { id, name, isLecture, startDate, endDate, active, code, calendarLink, term, courseImg, totalStudents, teachers, tabs } = this
        const data = {
            id, name, isLecture, startDate, endDate, active, code, calendarLink, term, courseImg, totalStudents, teachers, tabs,
            announcements: this.announcements, assignments: this.assignments
        }
        return data
    }
}
export default class StudentCavas {
    constructor (accessToken, subdomain) {
        this.accessToken = accessToken
        this.subdomain = subdomain
        this.canvasInterface = createCanvasInterface(accessToken, subdomain, { defaultPageLength: 100 })

        this.activeCourses = null  // Stores the courseIds of all active courses
        this.courses = {}  // Stores courses where the key is the courseId
    }

    async getActiveCourses () {
        this.activeCourses = []
        const courses = await this.canvasInterface('/api/v1/courses', {
            include: [ 'term', 'course_image', 'total_students', 'teachers', 'tabs' ],
            enrollment_state: 'active'
        })
        for (const course of courses) {
            const { id } = course
            this.activeCourses.push(id)
            course.active = true
            if (id in this.courses) {
                // Then it is possible that we already has metadata. We need to preserve that
                ({
                    permissions: course.permissions,
                    announcements: course.announcements,
                    announcementUpatedDate: course.announcementUpatedDate,
                    assignments: course.assignments,
                    assignmentsUpdateDate: course.assignmentsUpdateDate

                } = this.courses[id].data)
            }
            this.courses[id] = new Course(course)

        }
    }

    async getAllCourses () {
        const courses = await this.canvasInterface('/api/v1/courses', {
            include: [ 'term', 'course_image', 'total_students', 'teachers', 'tabs' ]
        })
        for (const course of courses) {
            if (course.course_code == null) {
                // Some courses are restricted access. We just ignore them.
                continue
            }
            const { id } = course
            course.active = this.activeCourses != null ? this.activeCourses.includes(id) : null
            if (id in this.courses) {
                // Then it is possible that we already has metadata. We need to preserve that
                ({
                    permissions: course.permissions,
                    announcements: course.announcements,
                    announcementUpatedDate: course.announcementUpatedDate,
                    assignments: course.assignments,
                    assignmentsUpdateDate: course.assignmentsUpdateDate

                } = this.courses[id].data)
            }
            this.courses[id] = new Course(course)
        }
    }

    async awaitForAll(courseIds, callable) {
        const data = []
        const promises = []
        const call = async (id, index) => {
            const res = await callable.bind(this)(id)
            data[index] = res
        }
        for (const i in courseIds) {
            const id = courseIds[i]
            promises.push(call(id, i))
        }
        await Promise.all(promises)
        return data
    }

    async getCoursePermissions (courseId) {
        // Permissions should not change so we should not waste time updating them
        if (this.courses[courseId].data.permissions == null) {
            let permissions = null
            try {
                permissions = await this.canvasInterface(`/api/v1/courses/${courseId}/permissions`)
            } catch (err) {
                console.error('Failed to get permissions:', courseId, err)
                throw err
            }
            this.courses[courseId].data.permissions = permissions
        }
    }

    async getAnnouncements (courseIds, updatePermissions=true) {
        // We allow courseIds to also just be a single id
        if (!Array.isArray(courseIds)) {
            courseIds = [courseIds]
        }
        if (courseIds.length == 0) {
            throw 'A course must be provided to getAnnouncements'
        }
        // First we update permissions so we can be sure that our requests will pass
        if (updatePermissions) {
            await this.awaitForAll(courseIds, this.getCoursePermissions)
        }

        // Now we get all the course objects in question
        const relevantCourses = Object.values(this.courses).filter(course => courseIds.includes(course.data.id))

        // Then we need to find the first date were announcement matter.
        // This will be the date where the first course started. I don't think annoucements can be posted before the start but it's something to look at
        const startDates = relevantCourses.map(course => new Date(course.data.start_at))
        const firstDate = new Date(Math.min(...startDates))
        const lastDate = new Date()

        const context_codes = relevantCourses.filter(course => course.data.permissions != null && course.data.permissions.hasOwnProperty('read_announcements')).map(course => `course_${course.data.id}`)
        const announcements = await this.canvasInterface(`/api/v1/announcements`, {
            start_date: firstDate.toISOString(),
            end_date: lastDate.toISOString(),
            context_codes
        })
        for (const announcement of announcements) {
            const { context_code } = announcement
            const courseId = context_code.split('_')[1]
            this.courses[courseId].setAnnouncements([announcement])
        }
    }

    async getAssignments (courseIds, updatePermissions=true) {
        // We allow courseIds to also just be a single id
        if (!Array.isArray(courseIds)) {
            courseIds = [courseIds]
        }
        if (courseIds.length == 0) {
            throw 'A course must be provided to getAssignments'
        }
        // First we update permissions so we can be sure that our requests will pass
        if (updatePermissions) {
            await this.awaitForAll(courseIds, this.getCoursePermissions)
        }

        // Now we get all the course objects in question
        const relevantCourses = Object.values(this.courses).filter(course => courseIds.includes(course.data.id))

        const updateCourseAssignments = async courseId => {
            const assignments = await this.canvasInterface(`/api/v1/courses/${courseId}/assignments`, {
                include: ['submission', 'score_statistics']
            })
            this.courses[courseId].setAssignments(assignments)
        }
        const validCourseIds = relevantCourses.filter(course => course.data.permissions != null && course.data.permissions.hasOwnProperty('read_grades')).map(course => course.data.id)
        await this.awaitForAll(validCourseIds, updateCourseAssignments)
    }

    async getCourseExtras (courseIds) {
        // We allow courseIds to also just be a single id
        if (!Array.isArray(courseIds)) {
            courseIds = [courseIds]
        }
        // First we update permissions so we can be sure that our requests will pass
        await this.awaitForAll(courseIds, this.getCoursePermissions)
        await Promise.all([
            this.getAnnouncements(courseIds, false),
            this.getAssignments(courseIds, false)
        ])
    }

    async getAllCourseExtras () {
        await this.getCourseExtras(Object.values(this.courses))
    }

    async update () {
        const allActive = Object.values(this.courses).every(course => course.active)
        if (allActive) {
            await this.getActiveCourses()
        } else {
            await this.getAllCourses()
        }
        const hasAnnouncements = []
        const hasAssignments = []
        for (const course of Object.values(this.courses)) {
            if (course.announcements != null) {
                hasAnnouncements.push(course.id)
            }
            if (course.assignments != null) {
                hasAssignments.push(course.id)
            }
        }
        await Promise.all([
            this.getAnnouncements(hasAnnouncements, false),
            this.getAssignments(hasAssignments, false)
        ])
    }

    toJSON () {
        return this.courses
    }
}

export class RedactedCanvas extends StudentCavas {
    /**
     * This class is used to remove all sensitive information from the canvas.
     * This are:
     * Announcement read status.
     * Assignment submissions.
     * 
     * Besides that, it just does the work of finding the relevant courses and getting their information automatically.
     */
    static async setup (accessToken, subdomain) {
        const canvas = new RedactedCanvas(accessToken, subdomain)
        await canvas.update()
        return canvas
    }

    async update () {
        await this.getActiveCourses()
        this.activeLecturesList = Object.values(this.courses).filter(course => course.isLecture)
        const activeIdList = this.activeLecturesList.map(course => course.id)
        await this.getCourseExtras(activeIdList)
    }

    toJSON () {
        const courses = {}
        for (const lecture of Object.values(this.courses)) {
            const { id } = lecture
            const lec = lecture.toJSON()
            for (const assignment of lec.assignments) {
                assignment.submission = undefined
                assignment.submitted = undefined
            }
            for (const announcement of lec.announcements) {
                announcement.read = undefined
            }
            courses[id] = lec
        }
        return courses
    }
}