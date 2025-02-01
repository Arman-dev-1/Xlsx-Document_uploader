const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const ExcelJS = require('exceljs');
const validationConfig = require('./config/validation');
const Record = require('./models/Record');
const UserData = require('./models/UserData');

const app = express();
const port = process.env.PORT || 3001;

// Configure multer for file upload
const upload = multer({
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx files are allowed'));
    }
  },
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb+srv://asman105710:m8fr30MlDu0nADFz@cluster0.hdead.mongodb.net/Users')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use(express.json());

// Enable CORS for Next.js frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Validate Excel file
app.post('/api/validate', upload.single('file'), async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const errors = [];
    const sheetData = {};

    workbook.eachSheet((worksheet, sheetId) => {
      const sheetName = worksheet.name;
      sheetData[sheetName] = [];

      // Validate headers
      const headers = worksheet.getRow(1).values.slice(1);
      const missingColumns = validationConfig.requiredColumns.filter(
        (col) => !headers.includes(col)
      );

      if (missingColumns.length > 0) {
        errors.push({
          sheet: sheetName,
          row: 1,
          error: `Missing required columns: ${missingColumns.join(', ')}`,
        });
        return;
      }

      // Get column indices
      const columnIndices = {};
      headers.forEach((header, index) => {
        columnIndices[header] = index + 1;
      });

      // Validate data rows
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row

        const rowData = {};
        let hasError = false;

        validationConfig.requiredColumns.forEach((column) => {
          const value = row.getCell(columnIndices[column]).value;
          rowData[column] = value;

          const validation = validationConfig.columnValidations[column];
          if (validation.required && !value) {
            errors.push({
              sheet: sheetName,
              row: rowNumber,
              error: validation.errorMessage,
            });
            hasError = true;
          } else if (value && !validation.validate(value)) {
            errors.push({
              sheet: sheetName,
              row: rowNumber,
              error: validation.errorMessage,
            });
            hasError = true;
          }
        });

        if (!hasError) {
          sheetData[sheetName].push(rowData);
        }
      });
    });

    res.json({ errors, sheetData });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Save data
app.post('/api/save', async (req, res) => {
  try {
    const { userId, data } = req.body;

    // Try to find an existing document for the given userId
    let userDoc = await UserData.findOne({ userId });

    if (!userDoc) {
      // If no document exists, create a new one with the provided data
      userDoc = new UserData({ userId, sheetData: data });
    } else {
      // If the document exists, update the sheetData field
      userDoc.sheetData = data;
    }

    // Save the document to the database (this creates the document if it was new)
    await userDoc.save();

    res.json({
      success: true,
      message: 'Data saved successfully',
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// Load data
app.get('/api/load/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = await UserData.findOne({ userId });

    if (!userData) {
      return res.json({
        success: true,
        data: {},
      });
    }

    res.json({
      success: true,
      data: userData.sheetData,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Export to Excel
app.post('/api/export', async (req, res) => {
  try {
    const { data } = req.body;
    const workbook = new ExcelJS.Workbook();

    // Create sheets and add data
    for (const [sheetName, rows] of Object.entries(data)) {
      const worksheet = workbook.addWorksheet(sheetName);
      
      // Add headers
      worksheet.addRow(['Name', 'Amount', 'Date', 'Verified']);

      // Add data rows
      rows.forEach(row => {
        worksheet.addRow([row.Name, row.Amount, row.Date, row.Verified]);
      });

      // Format columns
      worksheet.getColumn('A').width = 20;
      worksheet.getColumn('B').width = 15;
      worksheet.getColumn('C').width = 15;
      worksheet.getColumn('D').width = 10;
    }

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=exported-data.xlsx'
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});