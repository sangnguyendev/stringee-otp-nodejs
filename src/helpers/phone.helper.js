/**
 * Chuyển SĐT về định dạng 84xxxx
 * @param {string} str 
 * @returns {string} 
 */

const detectPhone = (str) => {
    if(typeof str !== "string") {
      return "";
    }
    str  = str.replace(". ", "").replace(/\s+/g, "");
    if(str.substring(0, 1) === '0') {
        return '84' + str.replace(/\s+/g, "").substring(1, str.length);
    }
    if(str.substring(0, 2) === '84') {
      return '84' + str.replace(/\s+/g, "").substring(2, str.length);
    }
    if(str.substring(0, 3) === '+84') {
      return '84' + str.replace(/\s+/g, "").substring(3, str.length);
    }
    // Nếu SĐT có hơn 13 ký tự. Ex: 840919967227312
    // Loại bỏ 840 ở đầu (Stringee Bugs)
    if(str.length > 13) {
      if(str.startsWith('840')) return str.substring(3, str.length);
      return str;
    }

    return str;

  }
  /**
   * Chuyển SĐT về định dạng 0xxxx
   * @param {string} str 
   * @returns {string}
   */
  const decodePhone = (str) => {
    if(typeof str !== "string") {
      return "";
    }
    str = str.replace(" ", "").replace(". ", "").replace(/\s+/g, "");
    if(str.substring(0, 3) === '+84'){
        return '0' + str.substring(3, str.length);
    }
    else if(str.substring(0, 2) === '84'){
        return '0' + str.substring(2, str.length);
    } 
    return str;

  }

module.exports = {detectPhone, decodePhone}