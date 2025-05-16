export const getRandomId = () => {
  const currentDate = new Date();

  // Generate a random number between 1000 and 9999
  const randomNumber = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;

  // Create a random ID by concatenating date and random number
  const randomID = `${currentDate.getFullYear()}${(currentDate.getMonth() + 1)
    .toString()
    .padStart(
      2,
      "0"
    )}${currentDate.getDate()}${currentDate.getHours()}${currentDate.getMinutes()}${currentDate.getSeconds()}${randomNumber}`;

  return randomID;
};
