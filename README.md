# Canvas Student Wrapper
Exposes an object that contains a student's courses, their announcements, and their grades.

## Usage:
Install with `npm install canvas-student-wrapper -S` and import using 

`import StudentCanvas, { RedactedCanvas } from 'canvas-student-wrapper'` in a `.mjs` file.

You can generate a student access token by going to canvas, navigating to the [profile settting page](https://q.utoronto.ca/profile/settings), and clicking on `+ New Access Token`. You can give this access token any name.

#### Student Canvas
Acts as an interface for everything a student can see on their course page. This includes read status for announcements and the status of their assignments.

To create an instance of StudentCanvas, use `const canvas = new StudentCavas(ACCESS_TOKEN, SUBDOMAIN)`.

StudentCanvas Methods:
* `getActiveCourses()`: Gets basic information about all courses the user is currently enrolled in. This does not include announcements or assignments.
* `getAllCourses()`: Gets basic information about all courses the user has ever been enrolled in. This does not include announcements or assignments.
* `getAnnouncements(COURSE_IDS)`: Get the announcements for all courses in `COURSE_IDS`.
* `getAssignments(COURSE_IDS)`: Get the assignments for all courses in `COURSE_IDS`.
* `getCourseExtras(COURSE_IDS)`: Gets both announcements and assignments for courses in `COURSE_IDS`.
* `update()`: Refreshes all courses, announcements, and assignments that are currently stored.
#### Redacted Canvas
This has most of the same functions as the student canvas, but it removes all sensitive information and autopopulates all currently active lectures.

To create an instance of RedactedCanvas, use `const canvas = await RedactedCanvas.setup(ACCESS_TOKEN, SUBDOMAIN)`.

The `update` method of RedactedCanvas only updates active courses.

### Course Object
Course objects Contain the following properties:

| Key | Property |
| --- | --- |
| `id` | A number that uniquely identifies the course on canvas. |
| `name` | The long, descriptive name of the course. |
| `code` | The course code. |
| `startDate` | A date object with the start date of the course. |
| `active` | A boolean representing whether the student is currently in the course. |
| `calendarLink` | A link to an ics file that has the course calendar. |
| `term` | An object with the keys `name`, `startDate`, and `endDate` that represents the term the course was taken in. |
| `courseImg` | A link to the front image of the course. |
| `totalStudents` | The total number of students in the course. |
| `teachers` | An array of objects with the keys `avatar`, `link`, and `name` that identify the course instructors. |
| `tabs` | An array of objects with the keys `id`, `label`, `link`, `position`, and `type` that point to canvas pages. |
| `announcements` | An array of `Annoucement` objects (Reference Below). |
| `assignments` | An array of `Assignment` objects (Reference Below). |

### Annoucement Object
Annoucement objects contain the following properties:

| Key | Property |
| --- | --- |
| `position` | Number that sorts the annoucements. |
| `title` | The title of the annoucement. |
| `message` | The body text of the annoucement |
| `read` | Whether the user has opened this announcement. |
| `author` | An object with a `name` key that identifies the person who posted the announcement. |
| `link` | A link to the announcement page. |
| `date` | The date that the announcement was made. |

### Assignment Object
Assignment objects contain the following properties:

| Key | Property |
| --- | --- |
| `position` | Number that sorts the annoucements. |
| `name` | The title of the assignment. |
| `description` | A detailed description of the assignment. |
| `dueDate` | A date object representing the due date. |
| `unlockDate` | A date object representing the date the assignment will be available at. |
| `counts` | A boolean value representing whether the assignment will effect the final grade. |
| `allowedAttempts` | A number representing the number of times the user can submit. |
| `submitted` | A boolean representing whether the user has submitted. |
| `link` | A link to the assignment page. |
| `submission` | A `Submission` object. (Reference Below) |
| `possiblePoints` | A number representing the max number of points on the assignment |
| `submitted` | Whether the student has submitted this assignment. |

### Submission Object
Submission objects contain the following properties:

| Key | Property |
| --- | --- |
| `score` | A number representing how many points the student got. |
| `possiblePoints` | The max number of points that could be achieved. |
| `submissionDate` | The date that the user submitted. |
| `gradedDate` | The date that the submission was graded. |
| `graded` | A boolean representing if the submission has been graded. |
| `late` | A boolean representing if the submission was late. |
| `missing` | A boolean representing if the submission is missing. |
