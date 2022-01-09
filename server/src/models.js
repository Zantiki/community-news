import {hash} from "bcrypt";

let PropertiesReader = require("properties-reader");
import Sequelize from 'sequelize';
import {$Request} from 'express'
const isCI = require('is-ci');
let properties = PropertiesReader("server.properties");
let demo = properties.get("demo");

const Model = Sequelize.Model;

export const sequelize :Sequelize = init();
let reset = true;


function init() {
    if (!isCI){
        console.log("Demo");
        let sequelize = new Sequelize(properties.get("database"), properties.get("user"), properties.get("password"), {
            host: properties.get("host"),
            dialect: 'mysql',
            pool: {
                max: 10,
                min: 0,
                idle: 10000
            },
        });
        return sequelize;
    }else{
        reset = true;
        console.log("CI");
        let sequelize = new Sequelize('School', 'root', '', {
            host: process.env.CI ? 'mysql' : 'localhost',
            dialect: 'mysql',
            pool: {
                max: 10,
                min: 0,
                idle: 10000
            },

        });
        console.log("sequelize initialized");
        return sequelize;
        //return sequelize
    }
}


export type Article = {
    id: number;
    userId: number;
    categoryId: number;
    createdAt: string;
    updatedAt: string;
    headline: string;
    disc: string;
    text: string;
    upvotes: number;
    image:string;
};

export type UserUpvote = {
    id: number;
    point: number;
    userId: number;
    articleId: number;
    createdAt: string;
    updatedAt: string;
};

export type ArticleUpvote = {
    id: number;
    upvotes: number;
    //articleId: number;
    createdAt: string;
    updatedAt: string;
}

export type Comment = {
    id: number;
    userId: number;
    text: string;
    createdAt: string;
    updatedAt: string;
    articleId: string;
};

export type User = {
    id: number;
    username: String;
    password: String;
    email: String;
    createdAt: string;
    updatedAt: string;
};
export type Category = {
    id: number;
    description: string;
    createdAt: string;
    updatedAt: string;
};


export let ArticleModel: Class<Model<Article>> = sequelize.define('articles', {
    id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },

    headline: {
        type: Sequelize.STRING,
        allowNull: false
    },
    disc: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    text: {
        type: Sequelize.TEXT,
        allowNull: false
    },
   /* upvotes: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
    },*/
    image: {
        type: Sequelize.TEXT,
        allowNull: true
    }
});

export let UserModel: Class<Model<User>> = sequelize.define('user', {
    id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    // attributes
    username: {
        type: Sequelize.STRING,
        allowNull: false
    },
    password: {
        type: Sequelize.STRING

    },
    email: {
        type: Sequelize.STRING,
        allowNull: false
    },
    online: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
});
export let CommentModel: Class<Model<Comment>> = sequelize.define('comment', {
    id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    text: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

export let UserUpvoteModel: Class<Model<UserUpvote>> = sequelize.define('userupvote', {
    id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    point: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
});

export let ArticleUpvoteModel: Class<Model<ArticleUpvote>> = sequelize.define('articleupvote', {
    id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    upvotes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
});

export let CategoryModel: Class<Model<Category>> = sequelize.define('category', {
    id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    description: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

CommentModel.belongsTo(UserModel);
CommentModel.belongsTo(ArticleModel);
ArticleModel.belongsTo(UserModel);
ArticleModel.belongsTo(CategoryModel);
UserUpvoteModel.belongsTo(UserModel);
UserUpvoteModel.belongsTo(ArticleModel);
//ArticleUpvoteModel.belongsTo(ArticleModel);
ArticleModel.belongsTo(ArticleUpvoteModel);

//Create testdata
export async function createData()  {
    let pword = "secret";
    hash(pword, 10, function(err, hash) {
        pword = hash;
    });
    console.log("Generating data");
    const categories = await CategoryModel.bulkCreate([
        { description: "sports" },
        { description: "politics" },
        { description: "entertainment" },
        { description: "economy" },
        { description: "international" }
    ]);
    const users = await UserModel.bulkCreate([
        { username: "user1", password: pword, email: "testmail" },
        { username: "user2", password: pword, email: "testmail" },
        { username: "user3", password: pword, email: "testmail" },
        { username: "user4", password: pword, email: "testmail" }
    ]);
    const articles = await ArticleModel.bulkCreate([
        { headline: "Guy in chair", disc: "Chilling like a villain", text: "Building a website is a great way to share your ideas and thoughts with the world. But if you've never done one, it can seem daunting. There's all that http-dot-whatever " +
                "and how do you get pictures and text in there? Well fear not, " +
                "this article will help you to grasp the intricacies very quickly!", image:
                "https://media.istockphoto.com/photos/happy-african-guy-sitting-on-chair-looking-away-picture-id176417874?k=20&m=176417874&s=170667a&w=0&h=zA_hINumdEVM8ox-Q9zQq07-FQzyQ9zxzcRYyk4B3-o="},
        { headline: "Sports are cool", disc: "movement is awesome :)", text:"Building a website is a great way to share your ideas and thoughts with the world. But if you've never done one, it can seem daunting. There's all that http-dot-whatever " +
                "and how do you get pictures and text in there? Well fear not, " +
                "this article will help you to grasp the intricacies very quickly!", image:
                "https://i.redd.it/kazq6jv71tp01.jpg"},
        { headline: "WAR!", disc: "oho not good its happening again", text: "Building a website is a great way to share your ideas and thoughts with the world. But if you've never done one, it can seem daunting. There's all that http-dot-whatever " +
                "and how do you get pictures and text in there? Well fear not, " +
                "this article will help you to grasp the intricacies very quickly!", image:
                "https://images01.military.com/sites/default/files/styles/full/public/2019-09/MightyStocklead1200.jpg?itok=cB1yf-K0"},
        { headline: "top 10 traveltips", disc: "Travel light and to warm places", text: "Building a website is a great way to share your ideas and thoughts with the world. But if you've never done one, it can seem daunting. There's all that http-dot-whatever " +
                "and how do you get pictures and text in there? Well fear not, " +
                "this article will help you to grasp the intricacies very quickly!", image:
                "https://www.atomix.com.au/media/2017/07/Stock_Photo_Mistake_1.jpg"},
        { headline: "ouch", disc: "I lost all my money gambling", text: "Building a website is a great way to share your ideas and thoughts with the world. But if you've never done one, it can seem daunting. There's all that http-dot-whatever " +
                "and how do you get pictures and text in there? Well fear not, " +
                "this article will help you to grasp the intricacies very quickly!", image:
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWxQW4M5qdyggFoIdJ_DxBh5zXLoQE07hEcPKqXYKdMdJ5fYvU&s"}
    ]);
    const comments = await CommentModel.bulkCreate([
        {text: "commenttest 1"},
        {text: "commenttest 2"},
        {text: "commenttest 3"},
        {text: "commenttest 4"},
        {text: "commenttest 5"},
        {text: "commenttest 6"}
    ]);

    const upvotes = await ArticleUpvoteModel.bulkCreate([
        {upvotes: 100},
        {upvotes: 1000},
        {upvotes: 10000},
        {upvotes: 100000},
        {upvotes: -100}
    ]);

    /*await upvotes[0].setArticle(articles[0]);
    await upvotes[1].setArticle(articles[1]);
    await upvotes[2].setArticle(articles[2]);
    await upvotes[3].setArticle(articles[3]);*/

    await articles[0].setArticleupvote(upvotes[0]);
    await articles[1].setArticleupvote(upvotes[1]);
    await articles[2].setArticleupvote(upvotes[2]);
    await articles[3].setArticleupvote(upvotes[3]);
    await articles[4].setArticleupvote(upvotes[4]);



    console.log("Data generated");
    await comments[0].setUser(users[0]);
    await comments[1].setUser(users[0]);
    await comments[2].setUser(users[2]);
    await comments[3].setUser(users[3]);
    await comments[4].setUser(users[3]);
    await comments[5].setUser(users[1]);

    await comments[0].setArticle(articles[0]);
    await comments[1].setArticle(articles[1]);
    await comments[2].setArticle(articles[2]);
    await comments[3].setArticle(articles[3]);
    await comments[4].setArticle(articles[0]);
    await comments[5].setArticle(articles[1]);
    console.log("FKs set");

    await articles[0].setUser(users[0]);
    await articles[1].setUser(users[1]);
    await articles[2].setUser(users[2]);
    await articles[3].setUser(users[2]);
    await articles[4].setUser(users[0]);

    await articles[0].setCategory(categories[3]);
    await articles[1].setCategory(categories[1]);
    await articles[2].setCategory(categories[0]);
    await articles[3].setCategory(categories[2]);
    await articles[4].setCategory(categories[4]);
    console.log("FKs set");
}


export function basicTestData(){
    sequelize.sync({force: false});
    return ArticleModel.create({
        headline: "headline1", disc: "this is a test", text: "still a test", image:
            "https://st3.depositphotos.com/9614272/14788/v/1600/depositphotos_147889185-stock-illustration-tv-test-image.jpg"
    }).then(() =>
        CategoryModel.create({
            description: "sports"
        })
    ).then(() =>
        CommentModel.create({
        text: "commenttest 1",
    })).then(() =>
        UserModel.create({
            username: "user1", password: "secret", email: "testmail"
    }))
}

export let syncModels = sequelize.sync({ force: reset}).then(() => {
   if (demo && reset) {
        createData();
    }else if(!demo){
        //console.log("Creating data");
        return ArticleModel.create({
            headline: "headline1", disc: "this is a test", text: "still a test", image:
                "https://st3.depositphotos.com/9614272/14788/v/1600/depositphotos_147889185-stock-illustration-tv-test-image.jpg"
        }).then(() => {
            console.log("Article created");
            CategoryModel.create({
                description: "sports"
            });
            console.log("Categories created");
        }

        ).then(() =>{
                CommentModel.create({
                    text: "commenttest 1",
                });
            console.log("Comment created");
        }
            ).then(() => {
                UserModel.create({
                    username: "user1", password: "secret", email: "testmail"
                });
                console.log("User created");
            }
        )
    }
});

export function close() {
    console.log("Closing con");
    return sequelize.close();
}