
function createBasicProfile(user){

    return{
        userId: user.userId,
        email: user.email,
        major: user.major,
        year: user.year,
    };
}

// decarator design pattern: add the students posts
function addPosts(profile, posts){
    return{
        ...profile,
        posts: posts
    };
}

// decarator design pattern: add the students comments
function addComments(profile, comments){
    return{
        ...profile,
        comments: comments
    };
}

// decarator design pattern: add the students enrollments
function addEnrollments(profile, enrollments){
    return{
        ...profile,
        enrollments: enrollments
    };
}

module.exports = {
    createBasicProfile,
    addPosts,
    addComments,
    addEnrollments,
};