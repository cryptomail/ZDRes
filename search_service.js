const { Client } = require('pg');
var Car =  require('./Car')

module.exports = class ZDSearch {

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

    async isValidCarId(carid) {
        if(!carid || carid < 0) {
            return false;
        }
        return true;
    }

    async searchCar(lat, lng, start, stop) {
        let self = this;
        let ret = null;


let stmt = ' SELECT CAR.*, DISTANCE(CAR.LAT, CAR.LNG, $1,$2) ' +
    ' FROM ZDRES.CAR CAR WHERE ' +
    '  NOT EXISTS (SELECT 1 FROM ZDRES.RESERVATION IR WHERE \n' +
    ' ($3 <= IR.START_T AND $4 <= IR.STOP_T AND $4 > IR.START_T ) \n' +
    ' OR \n' +
    '( $3 > IR.START_T AND $3 < IR.STOP_T AND $4 > IR.START_T AND $4 > IR.STOP_T ) \n' +
    'OR \n' +
    ' ( $3 < IR.START_T AND $4 > IR.STOP_T)  OR \n' +
    '( $3 > IR.START_T AND $3 < IR.STOP_T AND $4 > IR.START_T AND $4 < IR.STOP_T) \n' +
    ' AND IR.CAR_ID = CAR.ID) ' +
    'ORDER BY DISTANCE(CAR.LAT, CAR.LNG, $1,$2) ASC';


        try {
            ret = await self.client.query(stmt,
                [1,1,start, stop]).catch( function (reason) { console.error('ERROR',reason); return null; } );

            if (!ret || !ret.rows) {
                return ret;
            }

            return ret.rows;

        } catch (e) {
            console.log("**** WHY", e);
            await self.client.query('ROLLBACK')
            return 0;
            throw e
        } finally {

        }
    }


};



