/* this file uses the decorator design pattern

a basic profile object is created and the decorater
functions can add new features to it, without modifying the
basic profile

*/

function createBasicStudentProfile(user){
    return {
        userId: user.user_id,
        email: user.email,
        major: user.major,
        year: user.year,
        bio: user.bio
    };
}

// decorator: add the students posts
function addPosts(profile, posts){
    return {
        ...profile,
        posts: posts
    };
}

// decorator: add the student's comments
function addComments(profile, comments){
    return {
        ...profile,
        comments: comments
    };
}
// decorator: add the student's enrollments
function addEnrollments(profile, enrollments){
    return {
        ...profile,
        enrollments: enrollments
    };
}

module.exports = {
    createBasicStudentProfile,
    addPosts,
    addComments,
    addEnrollments
};