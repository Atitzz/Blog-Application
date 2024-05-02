// function show description for specified text
const descriptionText = (text, length) => {
    if (text.length <= length) {
        return text;
    } else {
        return text.substring(0, length) + '...'
    }
};

module.exports = descriptionText;