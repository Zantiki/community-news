// @flow

import {
    createData,
    sequelize,
    ArticleModel,
    UserModel,
    UpvoteModel,
    CommentModel,
    CategoryModel,
    close,
    basicTestData, syncModels
} from "../src/models";

beforeEach(() =>
    syncModels
);

describe('Get tests', () => {

    it('Articles get all', done => {
        ArticleModel.findAll().then(response => {
            console.log(response);
            let temp = [];
            response.map(article => temp.push({headline: article.headline}));
            expect(
                temp
            ).toEqual(
                [
                    {headline: "headline1"},
                ]
            );
            done();
        })
            .catch(error => console.log(error));
    });

    it('Articles get one', done => {
        ArticleModel.findByPk(1).then(response => {
            console.log(response);
            expect(
                response.headline
            ).toEqual(
                "headline1"
            );
            done();
        })
            .catch(error => console.log(error));
    });

    it('Categories get all', done => {
            CategoryModel.findAll().then(response => {
                console.log(response);
                let temp = [];
                response.map(category => temp.push({description: category.description}));
                expect(
                    temp
                ).toEqual(
                    [
                        { description: "sports" },
                    ]
                );
                done();
            })
                .catch(error => console.log(error));

    });
});


describe('Article actions', () => {

    it('Article create', done => {
        ArticleModel.create({headline: "Test", disc: "", text: "", image: "" }).then(response => {
            console.log(response);
            expect(
              response.headline
            ).toEqual(
                "Test"
            );
            done();
        });
    });

    it('Article update', done => {
        ArticleModel.update({ headline: "Updated", disc: "", text: "", image: ""}, {
            where: {
                id: 1
            }}).then(response => {
            console.log(response);
            expect(
                response
            ).toEqual(
                [1]
            );
            done();
        })
            .catch(error => console.log(error));
    });

    it('Article delete', done => {
        ArticleModel.destroy({where: { id: 1
            }}).then(response => {
            console.log(response);
            expect(
                response
            ).toEqual(
                    1
            );
            done();
        });
    });

});


