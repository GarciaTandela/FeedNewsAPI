//Importing models
const User = require('../models/user');
const Post = require('../models/post');

//Encrypt package
const bcrypt = require('bcryptjs');

//Validator package
const validator = require('validator');

//Json WebToken package
const jwt = require('jsonwebtoken');

//Deleting File Helper
const {clearImage} = require('../helper/deleteFile');

module.exports = {
    
    createUser: async function({userInput},req)
    {
        const email = userInput.email;
        const password = userInput.password;
        const name = userInput.name;

        const errors = [];

        if (!validator.isEmail(email)) 
        {
            const error = new Error('Invalid Email!');
            error.data = errors;
            error.code = 422;
            throw error;
        }

        if(!validator.isLength(name,{min:5}))
        {
            const error = new Error('Name is too short!');
            error.data = errors;
            error.code = 422;
            throw error;
        }

        if(!validator.isLength(password,{min:5}))
        {
            const error = new Error('Password is too short!');
            error.data = errors;
            error.code = 422;
            throw error;
        }

        const existingUser = await User.findOne({ email: email });

        if (existingUser) {
        const error = new Error('User already exists already!');
        error.data = errors;
        error.code = 422;
        throw error;
        }

        const hashedPw = await bcrypt.hash(password, 12);
        const user = new User({
        email: email,
        name: name,
        password: hashedPw
        });

        const createdUser = await user.save();

        return { ...createdUser._doc, _id: createdUser._id.toString() };
    },

    login: async function({ email, password }) 
    {
        const user = await User.findOne({ email: email });

        if (validator.isEmpty(email) && validator.isEmpty(password)) 
        {
            const error = new Error('Empty fields!');
            error.code = 401;
            throw error;
        }

        if (validator.isEmpty(email) || validator.isEmpty(password)) 
        {
            const error = new Error('One of the fields is empty!');
            error.code = 401;
            throw error;
        }

        if (!validator.isEmail(email)) 
        {
            const error = new Error('Invalid Email!');
            error.code = 401;
            throw error;
        }

        if (!user) {
          const error = new Error('User not found!');
          error.code = 401;
          throw error;
        }

        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) {
          const error = new Error('Password is incorrect!');
          error.code = 401;
          throw error;
        }
        const token = jwt.sign(
          {
            userId: user._id.toString(),
            email: user.email
          },
          'secret'
        );
        return { token: token, userId: user._id.toString() };
    },

    createPost: async function({ postInput }, req) {
        const title = postInput.title;
        const content = postInput.content;
        const imageUrl = postInput.imageUrl;

        if (!req.isAuth) {
          const error = new Error('Not authenticated!');
          error.code = 401;
          throw error;
        }

        const errors = [];
        if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 })) 
        {
            const error = new Error('Title is invalid.');
            error.data = errors;
            error.code = 422;
            throw error;
        }

        if (validator.isEmpty(content) || !validator.isLength(content, { min: 5 })) 
        {
            const error = new Error('Content is invalid.');
            error.data = errors;
            error.code = 422;
            throw error;
        }

        const user = await User.findById(req.userId);

        if (!user) 
        {
          const error = new Error('Invalid user.');
          error.code = 401;
          throw error;
        }

        const post = new Post({
          title: title,
          content: content,
          imageUrl: imageUrl,
          creator: user
        });

        const createdPost = await post.save();

        user.posts.push(createdPost);

        await user.save();

        return {
          ...createdPost._doc,
          _id: createdPost._id.toString(),
          createdAt: createdPost.createdAt.toISOString(),
          updatedAt: createdPost.updatedAt.toISOString()
        };

    },

    getPosts: async function({page},req)
    {

        if (!req.isAuth) 
        {
            const error = new Error('Not authenticated!');
            error.code = 401;
            throw error;
        }

        if (!page) 
        {
            page = 1;    
        }

        const totalPost = await Post.find().countDocuments();
        
        if (!totalPost) 
        {
            const error = new Error('There is no post to be listed!');
            error.code = 401;
            throw error;
        }

        const post = await Post.find()
            .sort({createdAt:-1})
            .populate('creator');

        return{

            //Map help us to transform the elements in the array
            posts:post.map(p => {
                return{
                    ...p._doc,
                    _id:p._id.toString(),
                    createAt:p.createdAt.toISOString(),
                    updatedAt:p.updatedAt.toISOString()
                }
            }),
            totalPosts:totalPost
        }
    },

    getUserData:async function({userId},req)
    {

        if (!req.isAuth) 
        {
            const error = new Error('Not authenticated!');
            error.code = 401;
            throw error;
        }
        
        const user = await User.findById(req.userId).populate('posts');

        if (!user) 
        {
            const error = new Error('User Not Found!');
            error.code = 404;
            throw error;    
        }

        return {
            ...user._doc,
            _id:user._id.toString(),
            createAt:user.createdAt.toISOString(),
            updatedAt:user.updatedAt.toISOString()
        }
    },

    getPost:async function({Id},req)
    {

        if (!req.isAuth) 
        {
            const error = new Error('Not authenticated!');
            error.code = 401;
            throw error;
        }

        const post = await Post.findById(req.post).populate('creator');

        if (!post) 
        {
            const error = new Error('Usuário não encontrado');
            error.code = 404;
            throw error;    
        }

        return {
            ...post._doc,
            _id:post._id.toString(),
            createAt:post.createdAt.toISOString(),
            updatedAt:post.updatedAt.toISOString()
        }
    },

    deletePost:async function({Id},req)
    {
        if (!req.isAuth) 
        {
            const error = new Error('Not authenticated!');
            error.code = 401;
            throw error;
        }

        const post = await Post.findById(req.post);

        if (!post) 
        {
            const error = new Error('Post not found!');
            error.code = 404;
            throw error;    
        }

        if (post.creator.toString() !== req.userId.toString()) 
        {
            const error = new Error('Not authorized to delete this post!');
            error.code = 403;
            throw error;
        }

        clearImage(post.imageUrl);
        
        await Post.findByIdAndRemove(req.post);

        const user = await  User.findById(req.userId);
        user.posts.pull(req.post);

        await user.save();

        return true;
    }
};