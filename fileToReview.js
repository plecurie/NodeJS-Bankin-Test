const domain = "bank.local.fr";

/**
 * @description Fetch transactions recursively
 * @param {string} fromDate The maximum date of transactions to return
 * @param {string} authorization Authorization header to authent the user
 * @param {jws} jws Jws token, mandatory if we get one from login request
 * @param {Number} id Account id
 * @param {Number} page Number of the page
 * @param {Object} previousTransactions Previous page of transactions (To check for dupes)
 * @return {Object} All transactions available on the page
 */
async function fetchTransactions(fromDate,
                                 authorization,
                                 jws = null,
                                 id,
                                 page,
                                 previousTransactions) {

    console.log(`--- Fetch Transactions page n°${page} ---`);

    try {
        let headers = {"Authorisation": authorization};

        if (jws) {
            headers = {
                "Authorization": authorization,
                "jws": jws,
                "Content-type": "application/json",
                "Accept": "application/json"
            }
        } else {
            headers = {
                "Authorization": authorization,
                "Content-type": "application/json",
                "Accept": "application/json",
            }
        }

        const {code, response} = await doRequest('GET',
            domain + '/accounts/' + id + '/transactions?' + `page=${page}`,
            headers);


        if (response && code === 200 && response.data) {
            if (response.data.meta) {
                if (response.data.meta.hasPageSuivante) {
                    let movements = response.data.Mouvements;
                    const date = movements[movements.length - 1].dateValeur;
                    if (date <= fromDate) {
                        console.log("FromDate is Reached - we don't need more transaction");
                    } else {
                        // if we have movements
                        if (movements) {
                            if (assertTransactions(movements)) {
                                return [];
                            } else {
                                console.log(`Push transactions from page ${page}`);
                            }
                        } else {
                            throw new Error("Empty list of transactions ! " + JSON.stringify(previousTransactions));
                        }
                        let nextPagesTransactions = fetchTransactions(fromDate, authorization, (jws || null), id, page + 1, movements);
                        response.data.Mouvements = movements.concat(nextPagesTransactions);
                    }
                }
            }
            return response.data.Mouvements;
        } else throw new Error();

        return [];
    } catch (err) {
        throw new CustomError({
            function: 'fetchTransactions',
            statusCode: 'CRASH',
            rawError: e,
        });
    }
}
