var Car =  require('../Car')
var ZDBooking = require('../reservation_service')
var assert = require('assert')
var c = new Car();

Date.prototype.addHours = function(h) {
    this.setTime(this.getTime() + (h*60*60*1000));
    return this;
}

var booking = new ZDBooking();

(async function() {
    await booking.init()
    await c.init()
    let car = await c.loadCar(1);
    //bookCar(uid, carid, start, stop, seq)
    await booking.deleteReservations(1);

    console.log('deleted successfully')
    var start = new Date();
    var end = new Date();
    end = end.addHours(4);

    /**
     * Book car 1 from now to four hours from now
     */
    let res = await booking.bookCar(1, car.carId,start,end,car.seq );

    assert.equal(res,1,'booked');

    car = await c.loadCar(1);

    /**
     * Book car 1 again with SAME data SHOULD FAIL
     */
    res = await booking.bookCar(1, car.carId,start,end,car.seq);

    assert.notEqual(res,1,'not booked');

    /*
    ** Move original start time to an hour before
     */
    car = await c.loadCar(1);
    var hourBefore = new Date(start);
    hourBefore = hourBefore.addHours(-1)

    var newStop = new Date(end)
    newStop = newStop.addHours(-1)
    /*
     * Book car 1 again with start less an hour and end less 1hr
     */
    res = await booking.bookCar(1, car.carId,hourBefore,newStop,car.seq );

    assert.notEqual(res,1,'not booked');

    /*
    book the car inbetween, should fail
     */
    car = await c.loadCar(1);
    var betweenStart = new Date(start);
    betweenStart = betweenStart.addHours(1)
    var betweenEnd = new Date(end);
    betweenEnd = betweenEnd.addHours(-1)

    res = await booking.bookCar(1, car.carId,betweenStart,betweenEnd,car.seq );

    /*
    Book the car for entire span greater on both sides
     */
    car = await c.loadCar(1);
    var bigStart = new Date(start);
    bigStart = bigStart.addHours(-1)
    var bigEnd = new Date(end);
    bigEnd = bigEnd.addHours(1);
    res = await booking.bookCar(1, car.carId,bigStart,bigEnd,car.seq );
    assert.notEqual(res,1,'not booked');

    /*
    Now book another time that's reasonable  but VIOLATE SEQUENCE:)
     */

    car = await c.loadCar(1);
    var secondStart = new Date(start);
    secondStart = secondStart.addHours(5)

    var secondStop = new Date(secondStart)
    secondStop = secondStop.addHours(1)
    res = await booking.bookCar(1, car.carId,secondStart,secondStop,car.seq-1 );
    assert.equal(res,0,' NOT booked second');

    /*
    Now book another time that's reasonable  but do not VIOLATE SEQUENCE:)
     */

    car = await c.loadCar(1);
    var secondStart = new Date(start);
    secondStart = secondStart.addHours(5)

    var secondStop = new Date(secondStart)
    secondStop = secondStop.addHours(1)
    res = await booking.bookCar(1, car.carId,secondStart,secondStop,car.seq);
    assert.equal(res,1,'  booked second');
    console.log("ok")


}());
