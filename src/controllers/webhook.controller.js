
const number_event_url = async(req, res, next) => {

    try {
        return res.send();
    } catch (error) {
        next(error);
    }

}

module.exports = {number_event_url};