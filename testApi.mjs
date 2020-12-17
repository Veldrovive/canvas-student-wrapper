import Canvas from "./canvas.mjs"
import config from './config.mjs'

function testGetCourses(canvas) {
    const courses = canvas.getCourses({active: true, code: 'ESC194'})
    const course = Object.values(courses)[0]
    console.log(course.announcements)
}

async function main() {
    const yearStartDate = new Date('2020-07-01')
    const canvas = await Canvas.create(config.accessToken, yearStartDate)
    testGetCourses(canvas)
}

main()