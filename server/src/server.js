//@flow
import express from 'express';
import path from 'path';
import reload from 'reload';
import fs from 'fs';
import {UserModel, ArticleModel, CategoryModel, UserUpvoteModel, ArticleUpvoteModel, CommentModel, sequelize} from "./models.js";
import type {Article, ArticleUpvote, User} from "./models.js";
import Sequelize from 'sequelize';
import WebSocket from 'ws';
import { compare, hash } from 'bcrypt';
import {sign, verify} from "jsonwebtoken";

const public_path = path.join(__dirname, '/../../client/public');
console.log(public_path);
let PropertiesReader = require("properties-reader");
let properties = PropertiesReader("server.properties");
let app = express();
let wss = new WebSocket.Server({ port: 4001 });

//Token keys.
let privateKey = properties.get("privateKey");
let publicKey = properties.get("publicKey");

//Websocket for sending newsfeed.
wss.on('connection', ws => {
  console.log("Websocket operational");
  //Send every 1 second
  setInterval(() => {
    ArticleModel.findAll({
      include: [
        { model: CategoryModel, attributes: ['description']},
        { model: UserModel, attributes: ['username'] },
        { model: ArticleUpvoteModel, attributes: ['upvotes']}
      ],
      limit: 2,
      order: [
        ['updatedAt', 'DESC']
      ]
    }).then((query) => {
      console.log("query made");
      ws.send(JSON.stringify(query));
    });
    }, 1000);
});

app.use(express.static(public_path));
app.use(express.json()); // For parsing application/json
let bodyParser = require("body-parser");
app.listen(4002);

//Get a specific article
app.get("/api/articles/:id", (req: express$Request, res: express$Response) => {
  console.log("got request for article: " +req.params.id);
  return ArticleModel.findOne({
    include: [
      { model: CategoryModel},
      { model: UserModel, attributes: ['username'] }
    ],where: {
      id: req.params.id
    }
  })
    .then(article =>  res.send(article))
      .catch(error => res.send(error));
});

//Get the upvotes for an article
app.get("/api/upvotes/:id", (req: express$Request, res: express$Response) => {
  console.log("got request for upvotes: " +req.params.id);
  ArticleModel.findByPk( req.params.id).then(article => {
    ArticleUpvoteModel.findOrCreate({
      where: {
        id: article.articleupvoteId
      }
    })
    .then(upvote  =>  {
      //console.log(upvote[0]);
      res.send(upvote[0])
    })
    .catch(err => console.log(err));
  }

  )
});

//Create a new article
app.post("/api/articles", (req: any, res: express$Response) => {
  console.log("Fikk request fra klient");
  let token = req.headers.token;
  verify(token, publicKey, (err, decoded) => {
    if (err) {
      console.log(err);
      res.status(401);
      res.json({error: "Not authorized"});
    } else {
      ArticleModel
          .create({
            userId: req.body.userId, categoryId: req.body.categoryId,
            headline: req.body.headline, disc: req.body.disc, text: req.body.text, image: req.body.image
          })
          .then(article => {
            ArticleUpvoteModel.create({}).then(upvotes =>
                article.setArticleupvote(upvotes)
            ).then(
                res.send({state: "Article registered", id: article.get("id")})
            )
                .catch(error => console.log(error));
          });
    }
  });
});


//Delete an article
app.delete("/api/articles/:id", (req: express$Request, res: express$Response) => {
  let token = req.headers.token;
  console.log(publicKey);
  ArticleModel.findByPk(req.params.id).then(article => {
    verify(token, publicKey, (err, decoded) => {
      if (err || decoded.id != article.userId) {
        console.log(err);
        res.status(401);
        res.json({error: "Not authorized"});
      } else {
        ArticleModel.destroy({where: {
            id: req.params.id
          }
        })
            .then(res.send({state: "Article deleted"}))
            .catch(error => res.send(error));
      }
    });
  });
});

//Edit an article
app.put("/api/articles/:id", (req: any, res: express$Response) => {
    console.log("edit article");
    let token = req.headers.token;
    ArticleModel.findByPk(req.params.id).then(article => {
      verify(token, publicKey, (err, decoded) => {
        console.log(decoded);
        console.log(article.userId);
        if (err || decoded.id != article.userId) {
          console.log(err);
          res.status(401);
          res.json({error: "Not authorized"});
        } else {
          ArticleModel.update(
              {headline: req.body.headline, disc: req.body.disc, categoryId: req.body.categoryId, text: req.body.text, image: req.body.image}, {
                where: {
                  id: req.params.id
                }
              })
              .then(article => res.send({state: "Article updated", id: req.body.id}))
              .catch(error => res.send(error));
        }
      });
    })
});

//Create a new upvote instance and update the relevant tables
app.post("/api/upvotes", (req: any, res: express$Response) => {
  console.log("Upvote request");
      UserUpvoteModel.findOrCreate({
        where: {articleId: req.body.articleId, userId: req.body.userId}
      }).then(query => {
        console.log("point:" + req.body.point);
        if ((query[0].point != req.body.point || query.point == 0) && (req.body.point >= -1 && req.body.point <= 1)) {
          ArticleModel.findByPk(req.body.articleId).then(article => {
                ArticleUpvoteModel.findOrCreate({
                  where: {id: article.articleupvoteId}
                }).then(articleVotes => {
                  if (req.body.point == 1 || req.body.point == -1) {
                    articleVotes[0].increment("upvotes", {by: req.body.point});
                  } else {
                    //articleVotes[0].decrement("upvotes", {by: req.body.point});
                  }
                });
              }
          );
          UserUpvoteModel.update(
              {point: query[0].point + req.body.point}, {
                where: {
                  userId: req.body.userId,
                  articleId: req.body.articleId
                }
              })
              .then(res.send({valid: true}));
        } else {
          res.send({valid: false});
        }
      });
});

//Get articles from a specific user
app.get("/api/user/:id/articles", (req: express$Request, res: express$Response) => {
  console.log("Requesting article for user: " + req.params.id);
  if (req.params.id != "home" && req.params.id != "recent") {
    ArticleModel.findAll(
        { where: {userId: req.params.id }
    })
    .then((query) => {
      console.log("query made");
      res.send(query);
    })
    .catch(error => res.send(error));
  }
});

//Get articles from a specific category and recent
app.get("/api/categories/:id", (req: express$Request, res: express$Response) => {
  console.log("Requesting: " + req.params.id);
  if (req.params.id != "home" && req.params.id != "recent") {
    ArticleModel.findAll({
      include: [
        { model: CategoryModel, where: { description: req.params.id } },
        { model: UserModel, attributes: ['username'] },
        { model: ArticleUpvoteModel, attributes: ['upvotes']}
      ],
      limit: 20,
      order: [
        ['updatedAt', 'DESC']
    ]
    })
    .then((query) => {
      console.log("query made");
      res.send(query);
    });
  }else if(req.params.id == "home"){
    ArticleModel.findAll({
      include: [
        {model: CategoryModel},
        { model: UserModel, attributes: ['username'] },
        { model: ArticleUpvoteModel, attributes: ['upvotes'], order: ['upvotes', 'DESC']}
      ],
      /*order: [[Sequelize.literal('articleupvote.upvotes'), 'DESC']],*/
      limit: 20,
      order: [
        ['updatedAt', 'DESC']
      ]
    })
    .then((query) => {
      console.log("query made");
      res.send(query);
    });
  }else{
    console.log("Requesting recent");
    ArticleModel.findAll({
      include: [
        { model: CategoryModel, attributes: ['description']},
        { model: UserModel, attributes: ['username'] },
        { model: ArticleUpvoteModel, attributes: ['upvotes']}
      ],
      limit: 3,
      order: [
      ['updatedAt', 'DESC']
    ]
    })
      .then((query) => {
      console.log("query made");
      res.send(query);
    });
  }
});

//Get the primary articles in home/description
app.get("/api/categories/:id/important", (req: express$Request, res: express$Response) => {
    console.log("Requesting important");
    if(req.params.id != "home"){
      ArticleModel.findAll({
        include: [
        {model: CategoryModel, where: {description: req.params.id}},
        { model: UserModel, attributes: ['username'] },
        { model: ArticleUpvoteModel, attributes: ['upvotes'], order: [
            ['upvotes', 'DESC']
          ] }
      ],
        limit: 3,
        order: [
          [Sequelize.literal('articleupvote.upvotes'), 'DESC']
        ],
      })
        .then((query) => {
        console.log("query made");
        res.send(query);
      });
    }else{
      ArticleModel.findAll({
        include: [
          { model: CategoryModel, attributes: ['description']},
          { model: UserModel, attributes: ['username'] },
          { model: ArticleUpvoteModel, attributes: ['upvotes'], order: [
              ['upvotes', 'DESC']
            ] }
        ],
        order: [
          [Sequelize.literal('articleupvote.upvotes'), 'DESC']
        ],
        limit: 3
      })
        .then((query) => {
        console.log("query made");
        res.send(query);
      });
    }
});


//Get all of the categories
app.get("/api/categories", (req: express$Request, res: express$Response) => {
  console.log("Requesting: " + req.params.category);
    CategoryModel.findAll({})
        .then(query => res.send(query));
});

//Get the comments connected to an article
app.get("/api/articles/:id/comments", (req: express$Request, res: express$Response) => {
  console.log("Requesting: " + req.params.id);
  CommentModel.findAll({ include: [
      { model: UserModel, attributes: ['username'] }
    ],
    where: {
      articleId: req.params.id
    }, order: [
      ['updatedAt', 'DESC']
    ],
  })
    .then(query => res.send(query))
      .catch(error => res.send(error));
});

//Post a comment
app.post("/api/comment", (req: {body: CommentModel}, res: express$Response) => {
  console.log("Got comment request");
  if(req.body.text != null){
    CommentModel
        .create({ userId: req.body.userId, articleId: req.body.articleId, text: req.body.text})
        .then(comment => {
          console.log(comment.get('text'));
          console.log("By: "+comment.get('userId'));
          res.send({state: "Comment registered", id: comment.get("articleId")});
        });
  }else{
    res.send({state: "Comment not registered", id: req.body.articleId});
  }

});

//Update user state
app.put("/api/user", (req: {body: User}, res: express$Response) => {
  console.log("Fikk innloggins request fra klient");
  console.log(req.body);
  if(req.body.password != undefined){
      console.log("recieved body: "+req.body);
    UserModel.findOne({where:{username: req.body.username} }).then(user =>{
      console.log(user);
      if(user){
        compare(req.body.password, user.password, function(err, result) {
          if(res) {
            user.update({online: true})
                .then(user => {
                  let token = sign({ username: user.username, id: user.id }, privateKey, {
                    expiresIn: 300});
                  res.send({username: user.username, id: user.id, token: token});
                });
          }
        });
      } else {
          res.send({username: undefined});
      }
    });
  }else{
    UserModel.findOne({where:{username: req.body.username}}).then(user => {
      if(user != null){
        user.update({online: false})
            .then(user => res.send({signedOut: true}));
      }else{
        res.send({signedOut: true});
      }
    })
  }
});

//Create a new user
app.post("/api/user", (req: {body: User}, res: express$Response) => {
  console.log("Fikk request fra klient");
  hash(req.body.password, 10, function(err, hash) {
    UserModel
        .create({ username: req.body.username, password: hash, email: req.body.email})
        .then(user => {
          console.log(user);
          console.log(user.get('username'));
          console.log(user.get('email'));
          res.json({username: req.body.username, state: "user registered"});
        });
  });
});

export let listen = new Promise<void>((resolve, reject) => {
  // Setup hot reload (refresh web page on client changes)
  reload(app).then(reloader => {
    app.listen(4000, (error: ?Error) => {
      if (error) reject(error.message);
      console.log('Express server started');
      // Start hot reload (refresh web page on client changes)
      reloader.reload(); // Reload application on server restart
      fs.watch(public_path, () => reloader.reload());
      resolve();
    });
  });
});
