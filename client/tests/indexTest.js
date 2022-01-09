
import * as React from 'react';
import { Component } from 'react-simplified';
import { Alert } from '../src/alert.js';
import { MainPage, Newslist, Upvote, Publish } from "../src/index.js";
import { shallow, mount } from 'enzyme';

describe('MainPage test', () => {
    const wrapper = shallow(<MainPage match={{params: {id: "sports"}}}/>);

    it('Main story render', () => {
        let instance = MainPage.instance();
        expect(typeof instance).toEqual("object");
        if (instance) expect(instance.importantArticles).toEqual([]);
    });

    it('Upvote render', () => {
        let instance = MainPage.instance();
        expect(typeof wrapper.find(Upvote)).toEqual("object");
    });

});

describe('Upvote test', () => {
    const wrapper = shallow(<Upvote match={{params: {id: 1}}}/>);

    it('Upvote render', () => {
        let instance = Upvote.instance();
        expect(typeof instance).toEqual("object");
        if (instance) expect(instance.upvotes).toEqual(null);
    });

    it('press upvote', done => {
        let instance = Publish.instance();
        wrapper.categoryId = 1;
        wrapper.find('#up').simulate('click');

        //Return a danger alert due to none-active server, this alert means the clientside of the process was successful.
        setTimeout(() => {
            let instance2 = Alert.instance();
            expect(typeof instance2).toEqual('object');
            if (instance2) expect(instance.alerts).toEqual([{ id: 0, text: "Please sign in", type: 'danger' }]);
            done();
        });
    });

});

describe('Register story test', () => {
    const wrapper = shallow(<Publish />);

    it('Register render', () => {
        let instance = Publish.instance();
        expect(typeof instance).toEqual("object");
        if (instance) expect(instance.categoryId).toEqual(0);
    });

    it('Publish', done => {
        let instance = Publish.instance();
        wrapper.categoryId = 1;
        wrapper.find('#publish').simulate('click');

        //Return a danger alert due to none-active server, this alert means the clientside of the process was successful.
        setTimeout(() => {
            let instance2 = Alert.instance();
            expect(typeof instance2).toEqual('object');
            if (instance2) expect(instance.alerts).toEqual([{ id: 0, text: undefined, type: 'danger' }]);
            done();
        });

    });
});

