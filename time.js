function addTime(input, min){
    const time =  parseInt(input.split(':')[0]) * 60 + parseInt(input.split(':')[1]) + min;
    const hours = (Math.floor(time/60) < 10)? '0'+Math.floor(time/60).toString()
                                            : Math.floor(time/60).toString();
    const minutes = (time%60 < 10)? '0'+ (time%60).toString()
                                    : (time%60).toString();
    return hours + ':' + minutes + ':00';
}

module.exports = {
    addTime: addTime
};