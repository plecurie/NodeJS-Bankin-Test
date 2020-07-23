const express = require('express');
const app = express();

const superagent = require('superagent');

app.listen(4000);
console.log('App running on port ', 4000);

const login = async () => {
    return new Promise(function (resolve, reject) {
        superagent.post('http://localhost:3000/login')
            .set({'Content-Type': 'application/json'})
            .auth('BankinClientId', 'secret')
            .send({ user: 'BankinUser', password: '12345678' })
            .end((err, res) => {
                if (err) {
                    reject(err);
                }
                resolve(res.body.refresh_token);
            })
    })
};

const getToken = (refresh_token) => {
    return new Promise(function (resolve, reject) {
        superagent.post('http://localhost:3000/token')
            .set({'Content-Type': 'application/x-www-form-urlencoded'})
            .query()
            .send({grant_type: 'refresh_token', refresh_token: refresh_token})
            .end((err, res) => {
                if (err) {
                    reject(err);
                }
                resolve(res.body.access_token);
            })
    });
};

const getAccounts = (access_token) => {
    return new Promise( function(resolve, reject) {
        superagent.get('http://localhost:3000/accounts')
            .set({'Content-Type': 'application/json'})
            .set('Authorization', 'Bearer ' + access_token)
            .end(async (err, res) => {
                if (err) {
                    reject(err);
                }
                const results = [];
                for (let account of res.body.account) {
                    results.push(await getTransactions(access_token, account));
                }
                resolve(results)
            })
    })
};

const getTransactions = (access_token, account) => {

    return new Promise( function(resolve, reject) {
        superagent.get('http://localhost:3000/accounts/' + account.acc_number + '/transactions')
            .set({'Content-Type': 'application/json'})
            .set('Authorization', 'Bearer ' + access_token)
            .end((err, res) => {
                if (err) {
                    reject(err);
                }
                const transactions = [];
                for (let transaction of res.body.transactions) {
                    transactions.push({label: transaction.label, amount: transaction.amount, currency: transaction.currency})
                }
                resolve( {acc_number: account.acc_number, amount: account.amount, transactions: transactions});
            });
    })
};

const main = async () => {
    login()
        .then(r_token => getToken(r_token))
        .then(token => getAccounts(token))
        .then((results) => {
            for (let result of results) {
                console.log(result)
            }
        })
        .catch((err) => {
            console.log(err)
        })
};

main();