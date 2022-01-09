// @flow
/* eslint eqeqeq: "off" */

import axios from "axios";
import {sharedComponentData} from "react-simplified";

axios.defaults.baseURL = "https://news.sebastianikin.com/api"
export type UserData = {
    id: string;
    username: string;
}

export type UpvoteData = {
    id: number;
    upvotes: number;
}
export type UserComment = {
    userId: string;
    text: string;
    articleId: number;
}

export type NewArticle = {
    userId: string;
    categoryId: number;
    headline: string;
    disc: string;
    text: string;
    image: string;
}

export type EditArticle = {
    id: number;
    userId: string;
    categoryId: number;
    headline: string;
    disc: string;
    text: string;
    image: string;
}

export class Category {
    id: number;
    description: string;
    createdAt: string;
    updatedAt: string;

    constructor(id:number, description:string, createdAt:string, updatedAt:string ){
        this.id = 0;
        this.description = description;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}

export class User {
    id: number;
    username: string;
    password: string;
    email: string;
    createdAt: string;
    updatedAt: string;
    constructor(id:number, username:string, password:string, email:string){
        this.id = 0;
        this.username = username;
        this.password = password;
        this.email = email;
    }
}

export class Article {
    id: number;
    userId: number;
    user: UserData;
    categoryId: number;
    createdAt: string;
    updatedAt: string;
    headline: string;
    disc: string;
    text: string;
    articleupvote: UpvoteData;
    image: string;

    constructor(id:number, headline: string, disc: string, text: string, image: string, createdAt:string, updatedAt:string, userId:number, categoryId:number) {
        this.id = id;
        this.headline = headline;
        this.disc= disc;
        this.text = text;
        this.image = image;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.categoryId = categoryId;
    }
}

export class Comment {
    id: number;
    userId: number;
    text: string;
    createdAt: string;
    updatedAt: string;
    articleId: number;

    constructor(id:number, text: string, createdAt:string, updatedAt:string, userId:number, articleId: number){
        this.id = id;
        this.userId = userId;
        this.text = text;
        this.articleId = articleId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}


export class UpvoteService {
    getUpvotes(id: number) {
        return axios.get<any>("/upvotes/" + id).then(response => response.data);
    }
}

export class FeedStore {
    url = "wss://news-api.sebastianikin.com";
    connection: WebSocket = new WebSocket(this.url);
    listener = null;
    feed: [] = [];


    getFeed(){
        return this.feed;
    }


    init(){
        // $FlowFixMe
         this.listener = this.connection.onmessage = e => {
             // $FlowFixMe
            this.feed = JSON.parse(e.data);
        };
    }


}

export class ArticleService {

    getArticles(category: string){
        return axios.get("/categories/"+category).then(response => response.data);
    }

    addArticle(article: NewArticle ){
        axios.defaults.headers = {
            'Content-Type': 'application/json',
            token: localStorage.getItem("token")
        };
        return axios.post("/articles", article).then(response => response.data);
    }

    getRecentArticles(){
        return axios.get("/categories/recent").then(response => (response = response.data));
    }

    getImportantArticles(category: string){
        return axios.get("/categories/"+category+"/important").then(response => (response = response.data));
    }

    getUserArticles(id: string){
        return axios.get("/user/"+id+"/articles").then(response => (response = response.data));
    }


    getArticle(id:number){
        return axios.get<Article>("/articles/"+id).then(response => response.data);
    }

    editArticle(article: EditArticle){
        axios.defaults.headers = {
            'Content-Type': 'application/json',
            token: localStorage.getItem("token")
        };
        console.log("put called on "+article.id);
        return axios.put("/articles/"+article.id, article).then(response => response.data);
    }

    deleteArticle(id:number, event: SyntheticEvent<HTMLButtonElement>){
        axios.defaults.headers = {
            'Content-Type': 'application/json',
            token: localStorage.getItem("token")
        };
        console.log("delete called on "+id);
        return axios.delete("/articles/"+id).then(response => response.data);
    }


    formatDate(date:string){
        let d = new Date(date) / 1000;
        let now = Date.now() / 1000;
        let diff = now - d;
        if(diff < 60*60 && diff > 60){
            return Math.round(diff / 60) +" Minutes ago"
        }else if(diff > 60*60 && diff < 60*60*24){
            console.log("Diff in hour: "+diff);
            return Math.round(diff / (60*60))+" Hours ago"
        }else if(diff > 60*60*24 && diff < 60*60*24*7 ){
            return Math.round(diff / (60*60*24))+" Days ago"
        }else if(diff > 60*60*24*7 ){
            return Math.round(diff / (60*60*24*7))+" Weeks ago"
        }
        return "Now"
    }


}

export class CommentService {
    comments: Comment[] = [];

    getComments(id: number){
        return axios.get("/articles/"+id+"/comments").then(response => (this.comments = response.data));
    }

    addComment(data: UserComment){
        return axios.post("/comment", data).then(response => (this.comments = response.data));
    }

}

export class CategoryService {
    categories: Category[] = [];

    getCategories(){
        return axios.get("/categories").then(response => (this.categories = response.data))
    }
}

export class UserStore {
    user: UserData = {username: "", id: ""};

    init(){
        let username: ?string = localStorage.getItem("username");
        let id: ?string = localStorage.getItem("id");
        if(id != undefined && username != undefined){
            this.user = {username: username, id: id};
        }
    }

    login(data: any){
        return axios.put("/user", data, {token: localStorage.getItem("token")}).then(response => {
            localStorage.setItem("username", response.data.username);
            localStorage.setItem("id", response.data.id);
            localStorage.setItem("token", response.data.token);
            console.log("UserService got: "+JSON.stringify(response.data));
            this.user = {username: response.data.username, id: response.data.id};
            return response.data
        });
    }

    logOut(){
        return axios.put("/user", this.user).then(response => {
            if(response.data.signedOut){
                console.log("logout called" );
                this.user.username = "";
                this.user.id = "";
                localStorage.clear();
                return "logout ok";
            }
            return "Error while logging out";
        });
    }

    register(data: User){
        return axios.post("/user", data).then(response => response.data);
    }

    vote(point: number, articleId: number){
        return axios.post("/upvotes", {point: point, articleId: articleId, userId: this.user.id})
            .then(response => (response.data));
    }

    getUsername(){
        if(this.user.username == null){
            return "Not signed in"
        }else{
            return this.user.username;
        }
    }
}


export let commentService = new CommentService();
export let categoryService = sharedComponentData(new CategoryService());
export let userService = sharedComponentData(new UserStore());
export let articleService = new ArticleService();
export let upvoteService = new UpvoteService();
export let feedStore = new FeedStore();
feedStore.init();
