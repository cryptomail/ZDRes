const { Client } = require('pg');

module.exports = class ZDCar {

    constructor() {
        let self = this;
        self.client = new Client();

    }
    async init() {
        let self = this;
        await self.client.connect();
    }
    async teardown() {
        let self = this;
        self.client.end();
    }

    async loadCar(carid) {
        let self = this;

        if((!carid) || carid < 0) {
            console.error('*** POSSIBLE BAD INPUT TELL UI GUY TO WISE UP', carid);
            return null;
        }

        var res = await self.client.query('SELECT * FROM ZDRES.CAR WHERE ID=$1 '
            ,
            [carid ]).catch( function (reason) { console.error('ERROR',reason); return null; } );


        var ret = {
            carId: res.rows[0].id,
            carMake: res.rows[0].make,
            seq: res.rows[0].reservation_seq
        };
        return ret;

    }

};




