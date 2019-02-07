var Car =  require('../Car')
var ZDBooking = require('../reservation_service')
var ZDSearch = require('../search_service')

var assert = require('assert')

Date.prototype.addHours = function(h) {
    this.setTime(this.getTime() + (h*60*60*1000));
    return this;
}


class TestValidInputsToCar {
    constructor() {
        var self = this;
        self.car = new Car();
    }
    async run() {
        var self = this;

        await self.car.init();

        await self.runBadCarId();
        await self.knownGood();
    }

    async runBadCarId() {
        var self = this;
        var c = await self.car.loadCar(undefined)
        assert.equal(c,null,'car is null with undefined input')
        c = await self.car.loadCar(null)
        assert.equal(c,null,'car is null with null input')
        c = await self.car.loadCar(-1)
        assert.equal(c,null,'car is null with negative input')
        c = await self.car.loadCar(0) // 1 base sequence id in PGSQL :)
        assert.equal(c,null,'car is null with negative input')

        console.log('TestValidInputsToCar: bad car id scenarios passed.')
    }

    async knownGood() {
        var self = this;
        var c = await self.car.loadCar(1) // 1 base sequence id in PGSQL :)
        assert.notEqual(c,null,'car is NOT null with positive input')
        console.log('TestValidInputsToCar: known good passed.')
    }
}

class TestInvalidInputsToBooking {
    constructor() {
        var self = this;

        self.booking = new ZDBooking();
    }
    async run() {

        let self = this;
        await self.booking.init();


        self.runBadCarIdDeleteReservations();

    }

    async runBadCarIdDeleteReservations() {

        let self = this;

        var res = await self.booking.deleteReservationsForCar(undefined)

        assert.equal(false,res,'deleteReservationsForCar undefined')
        res = await self.booking.deleteReservationsForCar(null)
        assert.equal(false,res,'deleteReservationsForCar null')
        console.log('runBadCarIdDeleteReservations: start.')
        res = await self.booking.deleteReservationsForCar(0)
        assert.equal(false,res,'deleteReservationsForCar undefined')
        res = await self.booking.deleteReservationsForCar(-1)
        assert.equal(false,res,'deleteReservationsForCar undefined')
        console.log('runBadCarIdDeleteReservations: known bad inputs passed.')
    }
}
class TestBookingInput {
    constructor() {
        var self = this;
        self.car = new Car();
        self.booking = new ZDBooking();
    }
    async run() {

        let self = this;
        await self.car.init();
        await self.booking.init();


        await self.runGoodInput();
        await self.runFailScenarioOne();
        await self.runFailScenarioTwo();

        await self.runFailScenarioThree();
        await self.runFailScenarioFour();
        await self.runFailScenarioFive();

    }

    async runGoodInput() {
        let self = this;

        /*
        Make idempotent, and delete existing records for target car
         */
        await self.booking.deleteReservationsForCar(1);


        let c = await self.car.loadCar(1);

        var start = new Date();
        var end = new Date();
        end = end.addHours(4);

        /**
         * Book car 1 from now to four hours from now
         */
        let res = await self.booking.bookCar(1, c.carId,start,end,c.seq );

        assert.equal(res,1,'booked');
        console.log('runGoodInput: passed.')
    }
    /*
    All subsequent functions idempotent and regenerative.
     */
    async runFailScenarioOne() {
        let self = this;
        await self.booking.deleteReservationsForCar(1);
        let c = await self.car.loadCar(1);

        var start = new Date();
        var end = new Date();
        end = end.addHours(4);

        /**
         * Book car 1 from now to four hours from now
         */
        let res = await self.booking.bookCar(1, c.carId,start,end,c.seq );

        assert.equal(res,1,'booked');

        /**
         * Book car 1 again with SAME data SHOULD FAIL
         */
        c = await self.car.loadCar(1);
        res = await self.booking.bookCar(1, c.carId,start,end,c.seq);

        assert.notEqual(res,1,'not booked');
        console.log('runFailScenarioOne: passed.')
    }

    async runFailScenarioTwo() {
        let self = this;
        await self.booking.deleteReservationsForCar(1);
        let c = await self.car.loadCar(1);

        var start = new Date();
        var end = new Date();
        end = end.addHours(4);

        /**
         * Book car 1 from now to four hours from now
         */
        let res = await self.booking.bookCar(1, c.carId,start,end,c.seq );

        assert.equal(res,1,'booked');

        /**
         * Book car 1 requested start an hour before, same end
         */

        c = await self.car.loadCar(1);
        var hourBefore = new Date(start);
        hourBefore = hourBefore.addHours(-1)

        res = await self.booking.bookCar(1, c.carId,hourBefore,end,c.seq);

        assert.notEqual(res,1,'not booked');
        console.log('runFailScenarioTwo: passed.')
    }
    async runFailScenarioThree() {
        let self = this;
        await self.booking.deleteReservationsForCar(1);
        let c = await self.car.loadCar(1);

        var start = new Date();
        var end = new Date();
        end = end.addHours(4);

        /**
         * Book car 1 from now to four hours from now
         */
        let res = await self.booking.bookCar(1, c.carId,start,end,c.seq );

        assert.equal(res,1,'booked');

        /**
         * Book car 1 requested start an hour before, hour after
         */

        c = await self.car.loadCar(1);
        var hourBefore = new Date(start);
        hourBefore = hourBefore.addHours(-1)
        var hourEnd = new Date(end);
        hourBefore = hourBefore.addHours(1)

        res = await self.booking.bookCar(1, c.carId,hourBefore,hourEnd,c.seq);

        assert.notEqual(res,1,'not booked');

        console.log('runFailScenarioThree: passed.')
    }

    async runFailScenarioFour() {
        let self = this;
        await self.booking.deleteReservationsForCar(1);
        let c = await self.car.loadCar(1);

        var start = new Date();
        var end = new Date();
        end = end.addHours(4);

        /**
         * Book car 1 from now to four hours from now
         */
        let res = await self.booking.bookCar(1, c.carId,start,end,c.seq );

        assert.equal(res,1,'booked');

        /**
         * Book car 1 requested start an hour after end, and hour after start but BAD SEQUENCE
         */

        c = await self.car.loadCar(1);
        var hourBefore = new Date(end);
        hourBefore = hourBefore.addHours(1)
        var hourEnd = new Date(hourBefore);
        hourEnd = hourEnd.addHours(1)

        res = await self.booking.bookCar(1, c.carId,hourBefore,hourEnd,c.seq-1);

        assert.notEqual(res,1,'booked!');
        console.log('runFailScenarioFour: passed.')
    }
    async runFailScenarioFive() {
        let self = this;
        await self.booking.deleteReservationsForCar(1);
        let c = await self.car.loadCar(1);

        var start = new Date();
        var end = new Date();
        end = end.addHours(4);

        /**
         * Book car 1 from now to four hours from now
         */
        let res = await self.booking.bookCar(1, c.carId,start,end,c.seq );

        assert.equal(res,1,'booked');

        /**
         * Book car 1 requested start an hour after end, and hour after start but GOOD SEQUENCE
         */

        c = await self.car.loadCar(1);
        var hourBefore = new Date(end);
        hourBefore = hourBefore.addHours(1)
        var hourEnd = new Date(hourBefore);
        hourEnd = hourEnd.addHours(1)

        res = await self.booking.bookCar(1, c.carId,hourBefore,hourEnd,c.seq);

        assert.equal(res,1,'booked!');
        console.log('runFailScenarioFive: passed.')
    }
}

class TestSearchInput {
    async init() {
        let self = this;
        self.search = new ZDSearch();
        self.booking = new ZDBooking();
        await self.search.init();
        await self.booking.init();
    }
    async run() {
        let self = this;
        self.init()
        self.runKnownGood();
    }

    async runKnownGood() {
        let self = this;
        var start = new Date();
        var end = new Date();
        end = end.addHours(4);
        await self.booking.deleteReservationsForCar(1);
        console.log('hi')
        let rowset = await self.search.searchCar("20.6729456","-103.7379675",start,end)
        console.log('*****DEBUG', rowset);
    }
}
(async function() {
    var validInputs = new TestValidInputsToCar();
    await validInputs.run();

    var bookingBadInputs = new TestInvalidInputsToBooking();
    await bookingBadInputs.run();

    var goodBookingInputs = new TestBookingInput();
    await goodBookingInputs.run();

    var goodSearchInput = new TestSearchInput();
    await goodSearchInput.run();
    console.log('*****CAR AND BOOKING SUITE PASSED*****')

}());
