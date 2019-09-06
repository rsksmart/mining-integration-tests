
function isInt(value) {
    return !isNaN(value) && 
           parseInt(Number(value)) == value && 
           !isNaN(parseInt(value, 10));
}
  
function isHex(value){
    return  new RegExp("0[xX][0-9a-fA-F]{64}$").test(value);
}
  
module.exports = {
    isInt,
    isHex
};