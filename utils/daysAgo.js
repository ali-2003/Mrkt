export const calculateDaysAgo = (inputDate) => {
  const currentDate = new Date();
  const previousDate = new Date(inputDate);
  const daysDifference = Math.floor(
    (currentDate - previousDate) / (1000 * 60 * 60 * 24)
  );

  if (daysDifference === 0) return "today";
  return `${daysDifference} days ago`;
};
