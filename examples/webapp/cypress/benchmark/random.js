const getRandomArbitrary = (min, max) => {
  return Math.random() * (max - min) + min;
};

// module.exports.getWaitValue = () => getRandomArbitrary(7000, 10000);
module.exports.getWaitValue = () => 5000;
