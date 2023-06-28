const mongoose = require("mongoose");


const userScheme = mongoose.Schema({ //connection with DB mongoose
    name:{
        type: String,
        required: [true, "S'il vous plait ajouter votre nom"], //Validation requeste
    },
    email:{
        type:String,
        required: [true, "S'il vous plait ajouter votre adress mail"],
        unique : true,
        trim: true,
        match:[
            /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            "Veuillez saisir une adresse e-mail valide"
        ]
    },
    password:{
        type: String,
        required: [true, "S'il vous plait ajouter votre mot de passe"],
        minLengh:[6, "Le mot de passe doit comporter jusqu'à 6 caractères"],
        minLengh:[23, "Le mot de passe ne doit pas comporter plus de 23 caractères"],
    },
    photo : {
        type: String,
        required: [true, "S'il vous plait ajouter votre photo"], //required ==> Validation
        default:"https://www.bing.com/images/search?view=detailV2&ccid=qalTuY86&id=09AAFBF9E6EA28FF25D7D6E2FB2601306E2A2E19&thid=OIP.qalTuY86Bigc41PgMrazBAHaHa&mediaurl=https%3a%2f%2fis5-ssl.mzstatic.com%2fimage%2fthumb%2fPurple125%2fv4%2fc4%2fce%2f06%2fc4ce06cd-cbe3-928b-bca2-ee7d05b6e0ba%2fsource%2f1280x1280bb.jpg&cdnurl=https%3a%2f%2fth.bing.com%2fth%2fid%2fR.a9a953b98f3a06281ce353e032b6b304%3frik%3dGS4qbjABJvvi1g%26pid%3dImgRaw%26r%3d0&exph=1024&expw=1024&q=google+traduction&simid=608055661813972106&FORM=IRPRST&ck=75F683B29BC7A13123D8F3805AC52366&selectedIndex=8&ajaxhist=0&ajaxserp=0"
    },
    phone : {
        type: String,
        default: "+212"
    },
    bio:{
        type:String,
        maxLengh:[250, "La biographie ne doit pas comporter plus de 250 caractères"],
        default:"bio"
    },
}, {
    timestamps: true, //time to update the data ==> You update at...
}
);
const User = mongoose.model("User", userScheme); //Now we can use the class User in our code to access our users
module.exports = User;