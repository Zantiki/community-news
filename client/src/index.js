// @flow
/* eslint eqeqeq: "off" */


import * as React from 'react';
import { Component, sharedComponentData } from 'react-simplified';
import { HashRouter, Route, NavLink } from 'react-router-dom';
import ReactDOM from 'react-dom';
import Card from 'react-bootstrap/Card';
import * as elements from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import Navbar from 'react-bootstrap/Navbar';
import FormControl from 'react-bootstrap/FormControl';
import Form from 'react-bootstrap/Form';
import Nav from 'react-bootstrap/Nav';
import ListGroup from 'react-bootstrap/ListGroup';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Accordion from 'react-bootstrap/Accordion';
import axios from "axios";
import { createHashHistory } from 'history';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import ListGroupItem from 'react-bootstrap/ListGroupItem';
import Carousel from "react-bootstrap/Carousel";
import DropdownButton from "react-bootstrap/DropdownButton";
import Dropdown from "react-bootstrap/Dropdown";
import {Alert} from "./alert";
import {
    userService,
    articleService,
    commentService,
    categoryService,
    User,
    Article,
    upvoteService, feedStore
} from "./services";
import type {Category} from "./services";
import type {EditArticle, UserComment} from "./services";
import CarouselItem from "react-bootstrap/CarouselItem";
import NavItem from "react-bootstrap/NavItem";

const history = createHashHistory();

export class Upvote extends Component < {articleId:number}>{
  upvotes = null;
  render(){
    return (
        <Row style={{maxWidth: "400px", minWidth: "400px" }}>
          <div className="d-sm-inline-block " style={{ maxWidth: "100px", minWidth: "100px", marginLeft: "10px" }}>
           <h>{this.upvotes} Upvotes</h>
          </div>
          <div className="d-sm-inline-block " style={{ maxWidth: "100px", minWidth: "100px", marginLeft: "10px" }}>
            <Button id={"up"} onClick={this.up} variant="primary" size="sm" block>
              Up
            </Button>
          </div>
          <div className="d-sm-inline-block " style={{ maxWidth: "100px", minWidth: "100px", marginLeft: "10px" }}>
            <Button id={"down"}  onClick={this.down} variant="danger" size="sm" block>
              Down
            </Button>
          </div>
        </Row>
    );
  }

  mounted() {
    setInterval(() => {
      upvoteService
          .getUpvotes(this.props.articleId)
          .then(upvotes => {
            this.upvotes = upvotes.upvotes;
          })
          .catch(err => console.log(err));
    }, 1000);
  }
  
  up(){
      if(userService.user.username == ""){
          Alert.danger("Please sign in");
          return;
      }else{
          userService.vote(1, this.props.articleId)
              .then(response => {
              if (response.valid) {
                  console.log("Can make vote");
              } else if (!response.valid) {
                  Alert.danger("Can only upvote once");
              }
          });
      }
  }
  
  down(){
      if(userService.user.username == ""){
          Alert.danger("Please sign in");
          return;
      }else{
          userService.vote(-1, this.props.articleId)
              .then(response => {
                  if (response.valid) {
                      console.log("Can make vote");
                  } else if (!response.valid) {
                      Alert.danger("Can only downvote once");
                  }
              });
      }
  }
}

class Footer extends Component{
    render(){
        return(
            <div className="footer-copyright text-center py-3">© 2018 Copyright:&nbsp;
                <a href="https://sebastianikin.tech">sebastianikin.tech</a>
            </div>
        );
    }
}

class Edit extends Component <{ match: { params: { id: number } } }>{
  id = 0;
  text = "";
  image = "";
  headline = "";
  disc = "";
  categoryId = 0;
  description = ""
  categories: [] = [];

  render(){
    return(
        <div className="row" style={{marginLeft: "30px"}}>
          <div className="col-md-8" style={{marginTop: "30px"}}>
            <DropdownButton
                drop={'right'}
                variant="secondary"
                title={"Category: "}
                id={`dropdown-button-drop-${'right'}`}
                key={'right'}>{this.categories.map(category => (
                <Dropdown.Item eventKey={category.id} onClick={(e) => this.setId(category.id, category.description, e)}>{category.description}&nbsp;</Dropdown.Item>
            ))}
            </DropdownButton>
            <h1>In: {this.description}</h1>
            <form onChange={(event: SyntheticInputEvent<HTMLInputElement>) => (this.headline = event.target.value)}>
              <Form.Control as="textarea" value={this.headline} placeholder="Headline" rows="2" style={{display: 'flex',  justifyContent:'center', alignItems:'center'}}/>
            </form>
            <form onChange={(event: SyntheticInputEvent<HTMLInputElement>) => (this.disc = event.target.value)}>
              <Form.Control as="textarea" value={this.disc} placeholder="Description"  rows="3" style={{display: 'flex',  justifyContent:'center', alignItems:'center'}}/>
            </form>
            <form onChange={(event: SyntheticInputEvent<HTMLInputElement>) => (this.text = event.target.value)}>
              <Form.Control as="textarea" value={this.text} placeholder="Article text" rows="10" style={{display: 'flex',  justifyContent:'center', alignItems: 'center'}}/>
            </form>
            <form onChange={(event: SyntheticInputEvent<HTMLInputElement>) => (this.image = event.target.value)}>
              <Form.Control as="textarea" value={this.image} placeholder="Image url" rows="2" style={{display: 'flex',  justifyContent:'center', alignItems:'center'}}/>
            </form>
            <Button variant="primary" onClick={this.update} size="lg" block>
              Publish
            </Button>
          </div>
          <div className="col-md-4" style={{marginTop: "30px"}}>
            <div style={{display: 'flex',  justifyContent:'center', alignItems:'center'}}>
              <img src={this.image} className="card-img" alt="Article image"></img>
            </div>
          </div>
        </div>);
  }
  mounted() {
    categoryService
        .getCategories()
        .then(categories => {
          this.categories = categories;
          console.log(this.categories);
        })
        .catch((error: Error) => console.error(error.message));
    console.log(this.props.match.params.id);
    articleService
        .getArticle(this.props.match.params.id)
        .then(article => {
          this.text = article.text;
          this.image = article.image;
          this.headline = article.headline;
          this.disc = article.disc;
          this.id = article.id;
          this.categoryId = article.categoryId;
          console.log("Mounted: "+article.headline);
        })
        .then(this.description = this.categories.find(category => category.id = this.categoryId  ))
        .catch((error: Error) => console.error(error.message));
  }

  setId(id, description, event: SyntheticEvent<HTMLButtonElement>){
    console.log("id chosen"+id);
    this.categoryId = id;
    this.description = description;
  }

  update(){
    console.log("update called");
    let article: EditArticle = {id: this.id, userId: userService.user.id, headline: this.headline,
      text: this.text, disc: this.disc, categoryId: this.categoryId, image: this.image};
    articleService.editArticle(article)
        .then(response => {
          console.log(response);
          if(response.state == "Article updated"){
            Alert.success("Article successfully updated");
            history.push("/read/"+response.id);
          }
        }).catch(err => {
            Alert.danger("Error while editing, please try again");
            if(err.response.status == 401){
                Alert.danger("You are not authorised");
                userService.logOut();
                history.push("/news/home");
            }
        });
  }
}
export class Publish extends Component{
  text = "";
  image = "";
  headline = "";
  disc = "";
  categoryId = 0;
  description = ""
  categories: Category[] = [];

  render(){
    return(
    <div className="row" style={{marginLeft: "30px"}}>
      <div className="col-md-8" style={{marginTop: "30px"}}>
          <DropdownButton
              drop={'right'}
              variant="secondary"
              title={"Category: "}
              id={`dropdown-button-drop-${'right'}`}
              key={'right'}>{this.categories.map(category => (
              <Dropdown.Item eventKey={category.id} onClick={(e) => this.setId(category.id, category.description, e)}>{category.description}&nbsp;</Dropdown.Item>
            ))}
          </DropdownButton>
        <h1>In: {this.description}</h1>
        <form onChange={(event: SyntheticInputEvent<HTMLInputElement>) => (this.headline = event.target.value)}>
            <Form.Control as="textarea" placeholder="Headline" rows="2" style={{display: 'flex',  justifyContent:'center', alignItems:'center'}}/>
        </form>
        <form onChange={(event: SyntheticInputEvent<HTMLInputElement>) => (this.disc = event.target.value)}>
          <Form.Control as="textarea" placeholder="Description"  rows="3" style={{display: 'flex',  justifyContent:'center', alignItems:'center'}}/>
        </form>
        <form onChange={(event: SyntheticInputEvent<HTMLInputElement>) => (this.text = event.target.value)}>
          <Form.Control as="textarea" placeholder="Article text" rows="10" style={{display: 'flex',  justifyContent:'center', alignItems: 'center'}}/>
        </form>
        <form onChange={(event: SyntheticInputEvent<HTMLInputElement>) => (this.image = event.target.value)}>
            <Form.Control as="textarea" placeholder="Image url" rows="2" style={{display: 'flex',  justifyContent:'center', alignItems:'center'}}/>
        </form>
          <Button id={"publish"} variant="primary" onClick={this.publish} size="lg" block>
            Publish
          </Button>
      </div>
      <div className="col-md-4" style={{marginTop: "30px"}}>
        <div style={{display: 'flex',  justifyContent:'center', alignItems:'center'}}>
          <img src={this.image} className="card-img" alt="Article image"></img>
        </div>
      </div>
    </div>);
  }

    mounted() {
      categoryService
          .getCategories()
          .then(categories => {
            this.categories = categories;
            console.log(this.categories);
          })
          .catch((error: Error) => console.error(error.message));
    }

  setId(id: number, description: string, event: SyntheticEvent<HTMLButtonElement>){
    console.log("id chosen"+id);
    this.categoryId = id;
    this.description = description;
  }
  publish(){
    let article = {userId: userService.user.id, headline: this.headline,
      text: this.text, disc: this.disc, categoryId: this.categoryId, image: this.image};
    articleService.addArticle(article)
        .then(response => {
          console.log(response);
          if(response.state == "Article registered"){
            Alert.success(response.state);
            history.push("/read/"+response.id);
          }
        }).catch(err => {
            Alert.danger("Error while creating article, please try again");
            if(err.response.status == 401){
                Alert.danger("Not authorized");
                userService.logOut();
                history.push("/news/home");
            }
        });
  }
}

class Story extends Component <{ match: { params: { id: number } } }>{
  story = new Article(0, "Placeholder", "", "", "", "", "", 0, 0);
    comments: [] = [];
    commentText: string = "";
  render(){
    if (this.story.id == 0 || this.comments == null) return null;
    return (
    <div className="container">
        <div id={"Story"} className="col-md-12">
          <h1>{this.story.headline}</h1>
          <Upvote articleId={this.story.id}/>
          <p className="card-text"><small className="text-muted">Author: {this.story.user.username}, Last Updated  {articleService.formatDate(this.story.updatedAt)}</small></p>
        </div>
        <div className="card mb-3" style={{display: "flex"}}>
          <div className="row no-gutters">
            <div className="col-md-4">
              <img src={this.story.image} className="card-img img-fluid" alt="..."/>
            </div>
            <div className="col-md-8">
              <div className="card-body">
                <h5 className="card-title">{this.story.disc}</h5>
                <p className="card-text">{this.story.text}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-12">
            <div className="col-md-12" style={{marginTop: "20px"}}>
                <div className="row">
                    <div className="col-md-12" style={{marginTop: "0px"}}>
                        <h4>Comments</h4>
                        <form onChange={(event: SyntheticInputEvent<HTMLInputElement>) => (this.commentText = event.target.value)}>
                            <Form.Control as="textarea" placeholder={"Comment"} rows="3" style={{display: 'flex'}}/>
                        </form>
                        <Button variant="primary" onClick={this.publish} size="lg" block>
                            Comment as {userService.getUsername()}
                        </Button>
                    </div>
                </div>
                <ListGroup >
                    {this.comments.map(comment => (
                        <ListGroupItem>
                            <div className="card" style={{maxHeight: '100px'}}>
                                <div className="card-body">
                                    <blockquote className="blockquote small-0">
                                        <footer className="blockquote-footer">By: {comment.user.username}, On: {articleService.formatDate(comment.updatedAt)}</footer>
                                        <p>{comment.text}</p>
                                    </blockquote>
                                </div>
                            </div>
                        </ListGroupItem>
                    ))}
                </ListGroup>
            </div>
        </div>
    </div>)
  }
  mounted() {
    console.log(this.props.match.params.id);
      commentService
          .getComments(this.props.match.params.id)
          .then(comments => {
              this.comments = comments;
              console.log("Mounted: "+this.comments.toString());
          });
    articleService
        .getArticle(this.props.match.params.id)
        .then(article => {

          this.story = article;
          console.log("Mounted: "+this.story.headline);
        })
        .catch((error: Error) => console.error(error.message));
  }
    publish(){
        if(this.commentText == ""){
            Alert.danger("Cannot comment without writing something");
            return;
        }else if(userService.user.id== ""){
            Alert.danger("Please sign in to comment");
            return;
        }
        let comment: UserComment = {userId: userService.user.id,
            text: this.commentText, articleId: this.props.match.params.id};
            commentService.addComment(comment)
            .then(response => {
                console.log(response);
                if(response.state == "Comment registered"){
                    this.commentText ="";
                    Alert.success(response.state);
                    this.mounted();
                }
            }).catch(err => Alert.danger("Error while publishing, please try again"));
    }

}

class Feed extends Component{
  articles: [] = [];
  //interval;
  render2(){
    return(
        <ul className="list-group list-group-horizontal-sm" >
          {this.articles.map(story => (
              <li className="list-group-item" style={{
                flex: 1,
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'stretch',
                height: 100
              }}>
                  <h5 className="card-title"><NavLink to={"/read/"+story.id}>{story.headline} </NavLink>
                  </h5>
                    <h6 className="card-subtitle mb-2 text-muted">{story.articleupvote.upvotes} Upvotes, {articleService.formatDate(story.updatedAt)}</h6>
              </li>
          ))}
        </ul>
    );
  }

  render(){
      if(this.articles.length == 0) return null;
      return(
          <Carousel controls={false} indicators={false} interval={2000}>
              {this.articles.map(story => (
                  <CarouselItem>
                      <div style={{display: "flex", justifyContent:'center', alignItems:'center'}}>
                          <h3 className="card-title">
                            <h1><NavLink to={"/read/"+story.id}>{story.headline} </NavLink></h1>
                              <h6 className="card-subtitle mb-2 text-muted">{story.articleupvote.upvotes} Upvotes, {articleService.formatDate(story.updatedAt)}</h6>
                          </h3>
                      </div>
                  </CarouselItem>
              ))}
          </Carousel>
      );
  }

  mounted(){
      setInterval(() => {this.articles = feedStore.getFeed()}, 1000);
  }
}

class  Menu extends Component<>{
  categories : Category[] = [];
  user: string = "";
  render(){
    return(
            <Navbar bg="light" variant="light">
              <Navbar.Brand>
                SocialNews
              </Navbar.Brand>
                <Nav className="mr-auto">
                    <NavItem>
                        <NavLink to={"/news/home"}>
                            home
                        </NavLink>
                    </NavItem>
                    {this.categories.map(category => (
                    <NavItem>
                        <NavLink to={"/news/"+category.description}>
                            {category.description}
                        </NavLink>
                    </NavItem>
                    ))}
                </Nav>
              {this.handleUser()}
            </Navbar>
    ); }

  mounted() {
    if(userService.user.username != ""){
      this.user = userService.getUsername();
    }
    categoryService
        .getCategories()
        .then(categories => {
          this.categories = categories;
          console.log(this.categories);
        })
        .catch((error: Error) => console.error(error.message));
  }

  handleUser(){
    if(userService.user.username != ""){
      let user = userService.user;
      return(<Nav>
          <NavItem>
              <NavLink activeStyle={{ color: 'darkblue' }} to={"/user/"+user.id}>
                  {user.username}
              </NavLink>
          </NavItem>
          <NavItem>
              <NavLink activeStyle={{ color: 'darkblue' }} to="/publish">
                  Write Article
              </NavLink>
          </NavItem>
      </Nav>);
    }else{
      return(
        <Nav>
        <NavLink activeStyle={{ color: 'darkblue' }} to="/login">
          Sign In
        </NavLink>
      </Nav>);
    }
  }
}

export class MainPage extends Component<{ match: { params: { id: string } } }> {
  allArticles: Article[] = [];
  importantArticles: Article[] = [];
  render() {
    return (
    <div className="col-lg-12">
        <Row>
            <div className="col-lg-6">
                <h2>Featured in {this.props.match.params.id}</h2>
                <Carousel>
                    {this.importantArticles.map(story => (
                        <Carousel.Item>
                            <div style={{display: "flex", justifyContent:'center', alignItems:'center'}}>
                                <div className="card mb-3" style={{display: "flex", justifyContent:'center', alignItems:'center'}}>
                                    <img src={story.image} className="card-img-top" alt={"Article image"} style={{maxHeight: "400px", maxWidth: "400px", display: "flex", justifyContent:'center', alignItems:'center'}}/>
                                    <div className="card-body">
                                        <Upvote articleId={story.id}/>
                                        <h2 className="card-title" style={{display: "flex", justifyContent:'center', alignItems:'center'}}>
                                            <NavLink activeStyle={{ color: 'darkblue' }} to={"/read/"+story.id}>
                                                {story.headline}
                                            </NavLink>
                                        </h2>
                                        <p className="card-text" style={{display: "flex", justifyContent:'center', alignItems:'center'}}><small className="text-muted">Author: {story.user.username}, Last Updated {articleService.formatDate(story.updatedAt)}</small></p>
                                        <p className="card-text" style={{fontStyle: "italic", display: "flex", justifyContent:'center', alignItems:'center' }}>{story.disc}</p>
                                    </div>
                                </div>
                            </div>
                        </Carousel.Item>
                    ))}
                </Carousel>
            </div>
            <div className="col-lg-6">
                <div className="">
                    <h2>Other stories</h2>
                    <ListGroup>
                        {this.allArticles.map(story => (
                            <Accordion style={{overflow: "auto"}}>
                                <Card key={story.id}>
                                    <Card.Header>
                                        <Card.Title>
                                            <div className="row">
                                                <div className="col">
                                                    <div className="col">
                                                        <NavLink activeStyle={{ color: 'darkblue' }} to={"/read/"+story.id}>
                                                            {story.headline}
                                                        </NavLink>
                                                    </div>
                                                    <div className="col">
                                                        {story.articleupvote.upvotes} Upvotes
                                                    </div>
                                                    <div className="col">
                                                        <Accordion.Toggle as={Button} variant="link" eventKey={story.id}>
                                                            See more
                                                        </Accordion.Toggle>
                                                    </div>
                                                </div>
                                                <div className="col" style={{ maxHeight: '100px', maxWidth: "200px"}}>
                                                    <img style={{ maxHeight: '100px'}} src={story.image} className="card-img" alt="Article image"></img>
                                                </div>
                                            </div>
                                        </Card.Title>
                                    </Card.Header>
                                    <Accordion.Collapse eventKey={story.id}>
                                        <Card.Body>
                                            <Card.Text>Updated: {articleService.formatDate(story.updatedAt)} by {story.user.username}
                                            </Card.Text>
                                            <Card.Text>{story.disc}
                                            </Card.Text>
                                        </Card.Body>
                                    </Accordion.Collapse>
                                </Card>
                            </Accordion>
                        ))}
                    </ListGroup>
                </div>
            </div>
        </Row>
    </div>);
  }


  mounted() {
    articleService
        .getImportantArticles(this.props.match.params.id)
        .then(articles => {
          this.importantArticles = articles;
        })
        .catch((error: Error) => console.error(error.message));
      articleService
          .getArticles(this.props.match.params.id)
          .then(articles => {
              this.allArticles = articles;
          })
          .catch((error: Error) => console.error(error.message));
  }
}

class Login extends Component {
  username = "";
  password = "";
  render() {
    return  <div className="container">
      <div className="row" style={{display: 'flex',  justifyContent:'center', alignItems:'center', height: '50vh'}}>
        <div className="col-lg-12">
          <Card>
            <Card.Body>
              <Form onChange={(event: SyntheticInputEvent<HTMLInputElement>) => (this.username = event.target.value)}>
                <Form.Group as={Row} controlId="formPlaintextEmail">
                  <Form.Label column lg="2">
                    Username
                  </Form.Label>
                  <Col sm="10">
                    <Form.Control size="lg" type="text" placeholder="Username" as="input" rows="1" style={{display: 'flex',  justifyContent:'center', alignItems:'center'}}/>
                  </Col>
                </Form.Group>
              </Form>
              <Form onChange={(event: SyntheticInputEvent<HTMLInputElement>) => (this.password = event.target.value)}>
                <Form.Group as={Row} controlId="formPlaintextPassword">
                  <Form.Label column lg="2">
                    Password
                  </Form.Label>
                  <Col sm="10">
                    <Form.Control size="lg" type="password" placeholder="Password" as="input" rows="1" style={{display: 'flex',  justifyContent:'center', alignItems:'center'}}/>
                  </Col>
                </Form.Group>
              </Form>
                <Button variant="primary" onClick={this.login} size="lg" block>
                  Log in
                </Button>
              <Row style={{justifyContent: 'center'}}>
                <p>
                  Not a member?&nbsp;
                  <NavLink activeStyle={{ color: 'darkblue' }} to="/register">
                    register...
                  </NavLink>
                </p>
              </Row>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  }

  login(){
    let user = new User(0, this.username, this.password, "");
    userService.login(user)
        .then(response => {
          console.log(response+" Logged in")
          if(response.username != undefined){
            Alert.success("Login successful");
              history.push("/user/"+response.id);
          }else{
            Alert.danger("Wrong username/password");
          }});
  }
}

class UserMenu extends Component <{ match: { params: { id: string } } }> {
  articles : [] = []
  render(){
    return  <div className="container">
      <div className="row" style={{display: 'flex',  justifyContent:'center', alignItems:'center', height: '50vh'}}>
        <div className="col-lg-12">
          <Card>
            <Card.Body>
              <Card.Title style={{marginTop: "0px"}}> Published articles </Card.Title>
              <ListGroup>
                {this.articles.map(story => (
                    <Card key={story.id}>
                      <Card.Header>
                        <Card.Title>
                          <div className="row">
                            <div className="col">
                              <div className="col">
                                  <NavLink activeStyle={{ color: 'darkblue' }} to={"/read/"+story.id}>
                                    {story.headline}
                                  </NavLink>
                                <Row style={{maxWidth: "300px", minWidth: "300px" }}>
                                  <div className="d-sm-inline-block " style={{ maxWidth: "100px", minWidth: "100px", marginLeft: "10px" }}>
                                    <Button onClick={(e) => this.edit(story.id, e)} variant="primary" size="sm" block>
                                      Edit
                                    </Button>
                                  </div>
                                  <div className="d-sm-inline-block " style={{ maxWidth: "100px", minWidth: "100px", marginLeft: "10px" }}>
                                    <Button onClick={(e) => this.delete(story.id, e)} variant="danger" size="sm" block>
                                      Delete
                                    </Button>
                                  </div>
                                </Row>
                              </div>
                            </div>
                          </div>
                        </Card.Title>
                      </Card.Header>
                    </Card>
                  ))}
                </ListGroup>
            </Card.Body>
            <Button variant="primary" onClick={this.logout} size="lg" block>
              Log out from {userService.getUsername()}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  }

  mounted() {
    articleService
        .getUserArticles(this.props.match.params.id)
        .then(articles => {
          this.articles = articles;
          console.log(this.articles);
        })
        .catch((error: Error) => console.error(error.message));
  }

  edit(id:number, event: SyntheticEvent<HTMLButtonElement>){
    history.push("/edit/"+id);
  }

  delete(id:number, event: SyntheticEvent<HTMLButtonElement>){
    console.log("delete called");
    articleService.deleteArticle(id, event)
        .then(response => {
          console.log(response);
          if(response.state == "Article deleted"){
            Alert.success("Article successfully deleted");
            this.mounted();
           // history.push("/user/"+this.props.match.params.id);
          }
        }).catch(err => {
            Alert.danger("Error while deleting, please try again");
                if(err.response.status == 401){
                    Alert.danger("You are not authorised");
                    userService.logOut();
                    history.push("/news/home");
                }
        });
  }

  logout(){
    userService.logOut()
        .then(response =>{
          console.log(response);
          if (response == "logout ok"){
            Alert.success(response);
            history.push("/login");
          }
        }
      ).catch(err => Alert.danger("Error while signing out, please try again"));
  }
}

class Register extends Component {
  username :string = "";
  email :string = "";
  password :string = "";
  passwordVer :string = "";
  render() {
    return  <div className="container">
      <div className="row" style={{display: 'flex',  justifyContent:'center', alignItems:'center', height: '50vh'}}>
        <div className="col-lg-12">
          <Card>
            <Card.Body>
              <form onChange={(event: SyntheticInputEvent<HTMLInputElement>) => (this.username = event.target.value)}>
                <Form.Group as={Row} controlId="formPlaintextEmail">
                  <Form.Label column lg="2">
                    Username
                  </Form.Label>
                  <Col sm="10">
                    <Form.Control size="lg" type="text" placeholder="Username" as="textarea" rows="1" style={{display: 'flex',  justifyContent:'center', alignItems:'center'}}/>
                  </Col>
                </Form.Group>
              </form>
              <form onChange={(event: SyntheticInputEvent<HTMLInputElement>) => (this.email = event.target.value)}>
                <Form.Group as={Row} controlId="formPlaintextEmail">
                  <Form.Label column lg="2">
                    Email
                  </Form.Label>
                  <Col sm="10">
                    <Form.Control size="lg" type="text" placeholder="Email" as="textarea" rows="1" style={{display: 'flex',  justifyContent:'center', alignItems:'center'}}/>
                  </Col>
                </Form.Group>
              </form>
              <form onChange={(event: SyntheticInputEvent<HTMLInputElement>) => (this.password = event.target.value)}>
                <Form.Group as={Row} controlId="formPlaintextPassword">
                  <Form.Label column lg="2">
                    Password
                  </Form.Label>
                  <Col sm="10">
                    <Form.Control size="lg" type="password" placeholder="Password" as="input" rows="1" style={{display: 'flex',  justifyContent:'center', alignItems:'center'}}/>
                  </Col>
                </Form.Group>
              </form>
              <form onChange={(event: SyntheticInputEvent<HTMLInputElement>) => (this.passwordVer = event.target.value)}>
                <Form.Group as={Row} controlId="formPlaintextPassword">
                  <Form.Label column lg="2">
                    Repeat Password
                  </Form.Label>
                  <Col sm="10">
                    <Form.Control size="lg" type="password" placeholder="Repeat password" as="input" rows="1" style={{display: 'flex',  justifyContent:'center', alignItems:'center'}}/>
                  </Col>
                </Form.Group>
              </form>
              <Button variant="primary" onClick={this.register} size="lg" block>
                Register
              </Button>
              <Row style={{justifyContent: 'center'}}>
              </Row>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  }

  register(){
    if(this.passwordVer == this.password){
      //let user = {username: this.username, email: this.email, password: this.password}
        let user = new User(0, this.username, this.password, this.email);
        userService.register(user)
          .then(response => {
            console.log(response)
            userService.login({username: response.username, password: this.password})
                .then(response => {
                    Alert.success("User successfully registered");
                    history.push("/user/"+response.id)}
            );
          }).catch(err => Alert.danger("Error while registering, please try again"));
    }
  }
}

console.log("JS called");
const root = document.getElementById('root');
if (root)
  ReactDOM.render(
    <HashRouter>
      <div>
        <Menu />
        <Feed />
        <Alert/>
        <Route exact path="/news/:id" component={MainPage} />
        <Route path="/login" component={Login} />
        <Route path="/publish" component={Publish} />
        <Route path="/register" component={Register} />
        <Route exact path="/read/:id" component={Story} />
        <Route exact path="/user/:id" component={UserMenu} />
        <Route exact path="/edit/:id" component={Edit} />
        <Footer/>
      </div>
    </HashRouter>,
    root
  );
