exports.whereLikeCreator = (data) => {
  if (!(typeof data === 'object')) {
    return '';
  }

  if (Array.isArray(data)) {
    return '';
  }

  const keys = [];
  let str = Object.keys(data).length ? 'WHERE ' : '';

  if (data) {
    for (const key in data) {
      if (data[key]) {
        keys.push(key);
      }
    }

    keys.forEach((el, idx) => {
      if (data[el]) {
        if (idx < keys.length - 1) {
          str += `${el} LIKE '${data[el]}%' AND `;
        } else {
          str += `${el} LIKE '${data[el]}%'`;
        }
      }
    });
  }

  if (!(str.length > 6)) {
    str = '';
  }

  return str;
};

exports.customSpesificQuery = (data) => {
  let keys = Object.keys(data);
  keys = keys.map((el) => {
    return `${el} = ?`;
  });
  keys = keys.join(' AND ');

  return keys;
};
