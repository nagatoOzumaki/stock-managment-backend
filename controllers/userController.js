const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Token = require("../models/tokenModel");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
var nodemailer = require('nodemailer');
const { log } = require("console");



const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: "1d"});
};

//Register User

const registerUser = asyncHandler (async (req, res) => {
    const {name , email , password}= req.body;


    //Validation
    if(!name || !email  || !password){
        res.status(400);
        throw new Error("Veuillez remplir tous les informations obligatoires");
    }
    if(password.length < 6){
        res.status(400);
        throw new Error("Le mot de passe doit comporter jusqu'à 6 caractères");
    }
    //Check if user email already exists in our DB
    const userExists = await User.findOne({email});

    if (userExists){
        res.status(400);
        throw new Error("L'adresse e-mail a déjà été utilisée");
    }

    //Encryp password before saving to DB
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    

    //Create new user
    const user = await User.create({
        name,
        email,
        password: hashedPassword,
    });
    //Generate Token
    const token = generateToken(user._id)

    //Send HTTP-Only cookie
    res.cookie("token", token, {
        path: "/", 
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 86400) ,//1 day
        sameSite: "none",
        secure:true,
        });
    if(user){
        const {_id , name, email, photo,phone, bio} = user
        res.status(201).json({
            _id,name, email, photo, phone, bio,token,
        }); //New date has been created in your DB
    } else {
        res.status(400);
        throw new Error("Données utilisateur non valides");
    }
});

//Login User
const loginUser = asyncHandler(async (req, res ) => {
    const {email , password} = req.body
    //Validate request
    if(!email || !password ){
        res.status(400);
        throw new Error("Veuillez saisir votre adresse mail et le mot de passe");
    }
    //Check if user exists in our DB
    const user = await User.findOne({email});
    if(!user ){
        res.status(400);
        throw new Error("Utilisateur introuvable, veuillez vous inscrire");
    }
    //User exists, check if password is corrects
    const passwordIsCorrect = await bcrypt.compare(password, user.password);

    //Generate Token

    const token = generateToken(user._id)

    //Send HTTP-Only cookie
    if(passwordIsCorrect){
        res.cookie("token", token, {
            path: "/", 
            httpOnly: true,
            expires: new Date(Date.now() + 1000 * 86400) ,//1 day
            sameSite: "none",
            secure:true,
            });
    }
    if (user && passwordIsCorrect){
        const {_id , name, email, photo,phone, bio} = user;
        res.status(201).json({
            _id,
            name,
            email,
            photo,
            phone,
            bio,
            token,
        });
    }else{
        res.status(400);
        throw new Error("E-mail ou mot de passe non valide");
    }
});
//Logout User
const logout =  asyncHandler(async(req, res) => {
    res.cookie("token", "", {
        path: "/", 
        httpOnly: true,
        expires: new Date(0),
        sameSite: "none",
        secure:true,
        });
        return res.status(200).json({message: "Successfully logged out"});
});

//Get user Profil
const getUser = asyncHandler (async(req,res) => {
    const user = await User.findById(req.user._id);

    if(user){
        const {_id , name, email, photo,phone, bio} = user;
        res.status(200).json({
            _id,name, email, photo, phone, bio,
        }); 
    } else {
        res.status(400);
        throw new Error("User Not found");
    }
});

//Get login status
const loginStatus = asyncHandler(async(req, res)=>{
    const token = req.cookies.token;
    if(!token){
        return res.json(false);
    };
    //Verify token
    const Verified = jwt.verify(token, process.env.JWT_SECRET);
    if(Verified){
        return res.json(true);
    };
});

//Update user
const updateUser =  asyncHandler(async(req,res) => {
    const user = await User.findById(req.user._id);
    if(user){
        const { name, email, photo,phone, bio} = user;
        user.email = email;
        user.name = req.body.name ||name;
        user.phone = req.body.phone ||phone;
        user.bio = req.body.bio ||bio;
        user.photo = req.body.photo ||photo;
        //Save the update
        const updateUser = await user.save();
        res.status(200).json({
            _id : updateUser._id,
            name:updateUser.name,
            email:updateUser.email,
            photo:updateUser.photo,
            phone:updateUser.phone, 
            bio:updateUser.bio,
        });
    }else{
        res.status(404);
        throw new Error("User not found");
    }
});
//Change Password
const changePassword = asyncHandler(async(req, res)=>{
    const user = await User.findById(req.user._id);

    const {oldPassword, password} = req.body;
    if(!user ){
        res.status(404);
        throw new Error("User not found, Please signup");
    };
    //Validation
    if(!oldPassword || !password ){
        res.status(404);
        throw new Error("Please add old and new password");
    }

    //Check if password matches password in DB

    const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);
    
    //Save new password

    if (user && passwordIsCorrect){
        user.password = password;
        await user.save();
        res.status(200).send("Password change successful");
    } else{
        res.status(404);
        throw new Error("Old password is incorrect");
    }
    });

    //Forgot Password

    const forgotPassword = asyncHandler(async(req,res)=>{
        const {email} = req.body;
        const user = await User.findOne({email});

        if(!user){
            res.status(404);
            throw new Error("User does not exist");
        }
        //Delete token if it exists in DB
        let token = await Token.findOne({userId: user._id});
        if (token) {
            await token.deleteOne();
        }

        //Create Reste Token
        let resetToken = crypto.randomBytes(32).toString("hex") + user._id;
        console.log(resetToken);

        //Hash token before saving to DB
        const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
        //Save Token to DB
        await new Token({
            userId: user._id,
            token: hashedToken,
            createAt: Date.now(),
            expiresAt: Date.now() + 30 * (60 * 1000), // 30 min
        }).save();

        //Construct Reset URL
        const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;
        //Reset Email
        const message = `
            <h2>Hello ${user.name}</h2>
            <p>Please use the url below to reset your password</p>
            <p>This reset link is valid for only 30 minites</p>

            <a href = ${resetUrl} clicktracking=off>${resetUrl}</a>
            <p>Regards...</p>
            <p>El Boukhari Youcef</p> `;
        const subject = "Password Reset Request";
        const send_to = user.email;
        const sent_from = process.env.EMAIL_USER;
        try {
            await sendEmail(subject, message, send_to, sent_from);
            res.status(200).json({success: true, message: "Reset Email Sent"});
        } catch (error) {
            res.status(500);
            throw new Error("Email not sent, please try again");
        }
    });

    //Reset Password
    const resetPassword = asyncHandler(async( req,res)=>{
        const{password} = req.body;
        const{resetToken}= req.params;
        //Hash token, then compare to Token in DB
        const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

        //Find token in DB

        const userToken = await Token.findOne({
            token: hashedToken,
            expiresAt: {$gt: Date.now()}
        })

        if (!userToken) {
            res.status(404);
            throw new Error("Invalid or Expired Token");
        }

        //Find User

        const user = await User.findOne({_id: userToken.userId});
        user.password = password;
        await user.save();
        res.status(200).json({
            message: "Password reset successful, Please Login"
        });
    });

module.exports = {
    registerUser,
    loginUser,
    logout,
    getUser,
    loginStatus,
    updateUser,
    changePassword,
    forgotPassword,
    resetPassword,
}