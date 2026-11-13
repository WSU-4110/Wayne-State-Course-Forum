/*
Name: Nickolas Yang 
Last Updated Date: October 20th, 2026 
File Name: scrapeCourses.js
File Description: This javascript file contains script to receive, parse, and extract course data the Wayne State Course Forum
needs to validate if courses are real or not.
*/


const axios = require("axios");
const cheerio = require("cheerio");
const pool = require("./db"); //USING NEON DATABASE ESTABLISHED IN db.js 
//above is just importing everything needed...


async function scrapeCourses(subject) {
    const subjectAbbrev = subject.trim().toUpperCase();
    const url = `https://bulletins.wayne.edu/courses/${subjectAbbrev.toLowerCase()}/`; // luckily the wayne state bulletins has good organization to search classes
    const response = await axios.get(url); //axios sends an HTTPS GET request to specific URL and gets the HTML data in variable response 
    const $ = cheerio.load(response.data); //cheerio puts the response data into a parsable format and we're storing that into $
    //$ is popular for using Cheerio for such things... something about it being similar or imitating jQuery 
    // . used in this case to tell cheerio to look at all courseblocktitle class objects
    const courses = [];
    $(".courseblocktitle").each((index, element) => {

    const courseblocktitle = $(element).text().trim(); // .text() just gets the text of the course title and .trim() just removes spaces before and after the text retrieved
    const [courseInfo, credits] = courseblocktitle.split(" Cr. "); //make an array such as below and also removes " Cr. "
    //["Subject CourseNumber CourseTitle", "numberOfCredits"]

    const parts = courseInfo.split(/\s+/); 
    /*

    / = start of the string and end of the string
    \s = whitespace characters
    + = makes the \s check more than one whitespace character

        This splits up courseInfo into another array of each string surrounded by a whitespace
        ["subject", "courseNumber", "courseTitle1", "courseTitle2"...]
    */

    const subject = parts[0];
    const courseNumber = parts[1];
    const courseTitle = parts.slice(2).join(" "); // makes new array after index 2 and combine all elementers after index 2 of parts

    courses.push ({  // push each class object courseblocktitle information into respective properties of the courses array
        subject: subject,
        courseNumber: courseNumber,
        courseTitle: courseTitle,
        credits: credits
    });
}); 

    // in event that the given subjectAbbrev given didnt have a corresponding subject
    if (courses.length === 0) {
        throw new Error(`No courses were found for ${subjectAbbrev}`);
    }

    // connect to postgresql
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // insert each course
       for (const course of courses) {
   

    const credits = course.credits?.trim();// ex: credits 1-5 3-17
    if (!credits) {
        throw new Error(`Invalid credits for ${course.subject} ${course.courseNumber}`); // have to do this because how credits are displayed in course bulletin ugh
    }


    await client.query(
        `INSERT INTO courses
        (subject, course_number, course_name, credits)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (subject, course_number)
        DO UPDATE SET
            course_name = EXCLUDED.course_name,
            credits = EXCLUDED.credits`,
        [
            course.subject,
            course.courseNumber,
            course.courseTitle,
            credits
        ]
    );
}

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }

    console.log(`Successfully stored ${courses.length} ${subjectAbbrev} courses`);

    return courses;
}


async function validateCourses(subject, inputCourse) {
    const subjectAbbr = subject.trim().toUpperCase(); //trim everything in case of whitespace
    const courseNumber = String(inputCourse).trim();

    const result = await pool.query( //communicate with db to ask if there is a subject ==
        `SELECT course_number FROM courses
         WHERE subject = $1`,
        [subjectAbbr]
    );

    if (result.rows.length > 0) { // does the course exist?
        return result.rows.some(
            course => course.course_number === courseNumber
        );
    }

    const courses = await scrapeCourses(subjectAbbr); // in case of subject not existing scrape just in case it does exist

    return courses.some( // returns true if the course was found.
        course => course.courseNumber === courseNumber
    );
}


module.exports = {
    scrapeCourses,
    validateCourses
}; // allows other backend files to access these functions as well

