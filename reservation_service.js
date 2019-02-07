const { Client } = require('pg');
var Car =  require('./Car')

module.exports = class ZDBooking {

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
    async deleteReservationsForCar(carid) {

        let self = this;

        if (!self.isValidCarId(carid)) {
            console.error('deleteReservationsForCar invalid input', carid)
            return false;
        }
        let stmt = ' DELETE FROM ZDRES.RESERVATION WHERE CAR_ID=$1';
        let ret = await self.client.query(stmt,[carid]);

        return ret && ret.rowCount;
    }
    async bookCar(uid, carid, start, stop, seq) {
        let self = this;
        let ret = null;
        if (!self.isValidCarId(carid)) {
            console.error('bookCar invalid input', carid)
            return false;
        }

let stmt = ' INSERT INTO ZDRES.RESERVATION (\n' +
    'USER_ID, CAR_ID, START_T, STOP_T ) \n' +
    'SELECT $1, $2, $3, $4  \n' +
    ' WHERE NOT EXISTS (SELECT 1 FROM ZDRES.RESERVATION IR WHERE \n' +
    ' ($3 <= IR.START_T AND $4 <= IR.STOP_T AND $4 > IR.START_T ) \n' +
    ' OR \n' +
    '( $3 > IR.START_T AND $3 < IR.STOP_T AND $4 > IR.START_T AND $4 > IR.STOP_T ) \n' +
    'OR \n' +
    ' ( $3 < IR.START_T AND $4 > IR.STOP_T)  OR \n' +
    '( $3 > IR.START_T AND $3 < IR.STOP_T AND $4 > IR.START_T AND $4 < IR.STOP_T) \n' +
    ' AND IR.CAR_ID = $2) RETURNING *';


        try {
            await self.client.query('BEGIN')
            ret = await self.client.query(stmt,
                [uid, carid, start, stop]).catch( function (reason) { console.error('ERROR',reason); return null; } );

            if(!ret.rowCount) {
                await self.client.query('ROLLBACK');
                console.log('Collision found, not inserting!!')
                return 0;
            }

            let carUpdate = await self.client.query('UPDATE ZDRES.CAR SET RESERVATION_SEQ = $1 WHERE ' +
                'ID = $2 AND RESERVATION_SEQ = $3', [seq + 1,
            carid, seq])

            if (!carUpdate.rowCount) {
                console.log('INVALID SEQUENCE DETECTED!!!!')
                await self.client.query('ROLLBACK')
                return 0
            } else {
                await self.client.query('COMMIT')
                return 1
            }

        } catch (e) {
            console.log("**** WHY", e);
            await self.client.query('ROLLBACK')
            return 0;
            throw e
        } finally {

        }
    }


};



