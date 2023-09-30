function addDays(date, x) {
    date.setDate(date.getDate() + x);
    return date;
}
function nextDay(date) {
    date.setDate(date.getDate() + 1);
    return date;
}
function dayDifference(date1, date2) {
    const time1 = date1.getTime();
    const time2 = date2.getTime();
    const timeStamp  = (time2 > time1) ? time2 - time1
                                        :time1 - time2;
    return timeStamp/86400000;
}
function timeStamp(date1, date2) {
    const time1 = date1.getTime();
    const time2 = date2.getTime();
    const timeStamp = (time2 - time1) / 60000;
    return Math.floor(timeStamp + 0.5);
}
function formatDate(date) {
    const formattedDate = date.toISOString().split('T')[0];
    return formattedDate;
}
function formateTime(date) {
    const time = date.toISOString().split('T')[1];
    const formatedTime = time.split('.')[0];
    return formateTime;
}
function formateDateTime (input) {
    const date = input.toISOString().split('T')[0];
    const time = (input.toISOString().split('T')[1]).split('.')[0];
    return date+' '+time;
}
function isAWorkingDay(input) {
    let date;
    if (typeof input === 'string') {
        date = new Date(input);
    } else {
        date = input;
    }
    const day = date.getDay();
    return (day == 5 || day == 6)? false: true;
}
function toJordan(date) {
    date.setHours(date.getHours() + 3);
    return date;
}
function Day(date) {
    switch(date.getDay()) {
        case 0:
            return "Sunday";
        case 1:
            return "Monday";
        case 2:
            return "Tuesday";
        case 3:
            return "Wednesday";
        case 4:
            return "Thursday";
        case 5:
            return "Friday";
        case 6:
            return "Saturday";
    }
}

function nearestDay (date) {
    if (isAWorkingDay(nextDay(date)))
        return date;
    else if (isAWorkingDay(nextDay(date,2)))
        return date;
    else
        return nextDay(date);
}



module.exports = {
    nextDay: nextDay,
    addDays: addDays,
    dayDifference: dayDifference,
    timeStamp:timeStamp,
    formatDate: formatDate,
    formateTime:formateTime,
    formateDateTime:formateDateTime,
    isAWorkingDay: isAWorkingDay,
    toJordan: toJordan,
    Day: Day,
    nearestDay: nearestDay
};