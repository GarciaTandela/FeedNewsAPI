//GraphQL package
const {buildSchema} = require('graphql');

module.exports = buildSchema(`
    type Post
    {
        _id: ID!
        title: String!
        content:String!
        imageUrl: String!
        creator: User!
        createdAt: String!
        updatedAt: String!
    }

    type User
    {
        _id:ID!
        name:String!
        email:String!
        password:String
        status:String!
        posts:[Post!]!
    }

    type AuthData
    {
        token:String!
        userId:String!
    }

    type PostData
    {
        posts:[Post!]
        totalPosts: Int!
    }

    input userInputData
    {
        email:String!
        password:String!
        name:String!
    }

    input postInputData
    {
        title: String!
        content:String!
        imageUrl: String!
    }

    type RootMutation
    {
        createUser(userInput:userInputData): User
        createPost(postInput:postInputData): Post
        deletePost(Id:ID):Boolean
    }

    type RootQuery
    {
        login(email:String!,password:String!): AuthData
        getPosts(page:Int):PostData
        getPost(Id:ID):Post
        getUserData(userId:ID):User
    }

    schema
    {
        query:RootQuery
        mutation:RootMutation
    }

`);

//The ! means is required