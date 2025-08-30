export const maxCalendarDate = () => {
  const currentDate = new Date();
  const maxYear = currentDate.getFullYear() - 16;
  const maxDate = new Date(maxYear, currentDate.getMonth(), currentDate.getDate());
  const formattedDate = maxDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  return formattedDate
};

