import StudentCavas, { RedactedCanvas } from './canvas.mjs'
import config from './config.mjs'

async function testCanvasStudent () {
    const canvas = new StudentCavas(config.accessToken, 'utoronto')
    await canvas.getActiveCourses()
    console.log('Active Course Ids:', canvas.activeCourses)
    console.log('Active Courses:', Object.values(canvas.courses).map(course => ({ code: course.short_course_code, name: course.name, lec: course.is_lecture, active: course.active, id: course.id })))

    await canvas.getAllCourses()

    await canvas.getCourseExtras(171419)
    const announcements = canvas.courses[171419].announcements
    const assignments = canvas.courses[171419].assignments
    console.log('Num Announcements:', announcements.length)
    console.log('Num Assignments:', assignments.length)

    const courseJSON = canvas.courses[171419].toJSON()
    console.log('Test Course:', courseJSON)

    const canvasJSON = JSON.parse(JSON.stringify(canvas.toJSON()))
    console.log('Canvas:', canvasJSON)

    const redactedCanvas = await RedactedCanvas.setup(config.accessToken, 'utoronto')
    const redactedJSON = JSON.parse(JSON.stringify(redactedCanvas.toJSON()))
    console.log('Redacted:', redactedJSON)

    setTimeout(async () => {
        await canvas.update()
        console.log('Num Announcements:', announcements.length)
        console.log('Num Assignments:', assignments.length)
    }, 1000)
}

async function main() {
    await testCanvasStudent()
}

main()