const validationConfig = {
  requiredColumns: ['Name', 'Amount', 'Date', 'Verified'],
  columnValidations: {
    Name: {
      required: true,
      validate: (value) => !!value,
      errorMessage: 'Name is required',
    },
    Amount: {
      required: true,
      validate: (value) => !isNaN(value) && parseFloat(value) > 0,
      errorMessage: 'Amount must be a positive number',
    },
    Date: {
      required: true,
      validate: (value) => {
        const date = new Date(value);
        const now = new Date();
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      },
      errorMessage: 'Date must be within the current month',
    },
    Verified: {
      required: false,
      validate: (value) => ['Yes', 'No'].includes(value),
      errorMessage: 'Verified must be either Yes or No',
    },
  },
};

module.exports = validationConfig;