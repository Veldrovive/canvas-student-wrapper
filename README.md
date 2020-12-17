# Canvas Student Wrapper
Exposes an object that contains a student's courses, their announcements, and their grades.

## Usage:
Install with `npm install canvas-student-wrapper -S` and import using `const canvas = require('canvas-student-wrapper')` or `import canvas from 'canvas-student-wrapper'`.

To create a student instance, you need two things: a student access token and the year start date.

You can generate a student access token by going to canvas, navigating to the [profile settting page](https://q.utoronto.ca/profile/settings), and clicking on `+ New Access Token`. You can give this access token any name.

The year start date defines which classes the student is currently in. Only classes that are currently active will have their assignments updated. The year start date must be a `Date` object. For example, `const yearStartDate = new Date('2020-07-01')`.

To create the student object and populate it, you must run `const student = await Canvas.create(<ACCESS-TOKEN>, yearStartDate)`.
To access a course, you can run `const courses = student.getCourses({active: <BOOLEAN>, code: <STRING>})`. This will create an array of `Course` objects. If `active` is set to `true`, then only courses after `yearStartDate` will be included. If `code` is set, then only courses who's course code contains the string will be included.

Each of the array elements is a `Course` object.

### Course Object
Course objects Contain the following properties:

| Key | Property |
| --- | --- |
| `id` | A number that uniquely identifies the course on canvas. |
| `name` | The long, descriptive name of the course. |
| `code` | The short name of the course. |
| `startDate` | A date object with the start date of the course. |
| `active` | A boolean representing whether the student is currently in the course. |
| `calendarLink` | A link to an ics file that has the course calendar. |
| `term` | An object with the keys `name`, `start`, and `end` that represents the term the course was taken in. |
| `courseImg` | A link to the front image of the course. |
| `totalStudents` | The total number of students in the course. |
| `teachers` | An array of objects with the keys `id` and `display_name` that identify the course instructors. |
| `tabs` | An array of objects with the keys `label` and `full_url` that point to canvas pages. |
| `announcements` | An array of `Annoucement` objects (Reference Below). |
| `assignments` | An array of `Assignment` objects (Reference Below). |

### Annoucement Object
Annoucement objects contain the following properties:

| Key | Property |
| --- | --- |
| `position` | Number that sorts the annoucements. |
| `title` | The title of the annoucement. |
| `message` | The body text of the annoucement |
| `created` | A date object that represents the time when the announcement was posted. |
| `read` | Whether the user has opened this announcement. |
| `author` | An object with a `name` key that identifies the person who posted the announcement. |
| `link` | A link to the announcement page. |

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
