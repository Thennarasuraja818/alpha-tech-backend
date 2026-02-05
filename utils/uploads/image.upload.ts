import path from "path";
import fs from "fs";
import { UploadedFile } from "express-fileupload";
import { StatusCodes } from "http-status-codes";
import puppeteer from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';
import { Parser } from 'json2csv';
import * as ExcelJS from 'exceljs';
import ejs from "ejs";

export class Uploads {
  static async processFiles(files: UploadedFile[], folderPath: string, type: string, docName: string | undefined, oldFileName: string = ""): Promise<any[]> {

    let allowedExtensions: any = []

    if (type === 'img') {
      allowedExtensions = ['jpg', 'jpeg', 'png'];
    } else if (type === 'doc') {
      allowedExtensions = ['doc', 'docx', 'pdf', 'xlsx'];
    } else if (type === 'video') {
      allowedExtensions = ['mp4', 'mov', 'avi', 'mkv'];
    } else if (type === 'All') {
      allowedExtensions = [];
    }

    const imageArray: any[] = [];

    for (const file of files) {
      const fileExtension = file.name.split(".").pop()?.toLowerCase();

      if (type != 'All' && (!fileExtension || !allowedExtensions.includes(fileExtension))) {
        throw new Error("Invalid file format");
      }

      const fileName = `${type}-${Date.now()}.${fileExtension}`;
      const result = await this.fileUpload(file, type === 'video' ? 'videos/' + folderPath : folderPath, fileName, "");

      console.log("File uploaded:", fileName);

      if (result) {
        imageArray.push({
          docName: fileName,
          docPath: folderPath,
          originalName: file.name,
        });
      }
    }

    return imageArray;
  }


  static async fileUpload(file: any, folder: string, fileName: string, oldFileName: string): Promise<any> {

    try {
      const folderPath = path.join('public', folder);

      if (!fs.existsSync(folderPath)) {
        console.log("Creating directory:", folderPath);
        fs.mkdirSync(folderPath, { recursive: true });
      }

      if (oldFileName) {
        const filePath = path.join(folderPath, oldFileName);

        if (fs.existsSync(filePath)) {
          console.log(`Deleting old file: ${oldFileName}`);
          fs.unlinkSync(filePath);
        } else {
          console.log(`File ${oldFileName} not found, skipping deletion.`);
        }
      }

      if (!file || !file.data) {
        console.error("Invalid file data");
        return false;
      }
      const filePath = path.join(folderPath, fileName);
      await new Promise<void>((resolve, reject) => {
        file.mv(filePath, (err: any) => {
          if (err) {
            console.error("Error moving file:", err);
            return reject(err);
          }
          console.log("File saved successfully:", filePath);
          resolve();
        });
      });
      return true;
    } catch (error) {
      console.error("Error saving file:", error);
      return false;
    }
  }
  static async generateDynamicPDF(
    data: any[],
    userId: string,
    options: {
      title?: string;
      logoUrl?: string;
      columns: {
        header: string;
        field: string;
        type?: 'text' | 'currency' | 'percentage' | 'number' | 'date' | 'time';
        align?: 'left' | 'center' | 'right';
        highlight?: {
          condition: (value: any) => boolean;
          class: string;
        }[];
      }[];
      footerText?: string;
    }
  ) {
    const tempDir = path.join(__dirname, '..', '..', 'public', 'temp_pdfs');

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const filename = `sales_target_${userId}_${uuidv4()}.pdf`;
    const filePath = path.join(tempDir, filename);
    const pdfUrl = `/temp_pdfs/${filename}`;

    // ✅ FIX: persistent browser profile (NO temp cleanup → NO EBUSY)
    const browserProfileDir = path.join(
      __dirname,
      '..',
      '..',
      'tmp_browser_profile',
      userId
    );

    if (!fs.existsSync(browserProfileDir)) {
      fs.mkdirSync(browserProfileDir, { recursive: true });
    }

    let browser;

    try {
      browser = await puppeteer.launch({
        headless: true,
        executablePath: puppeteer.executablePath(),

        // ✅ KEY FIX
        userDataDir: browserProfileDir,

        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-gpu",
          "--disable-dev-shm-usage"
        ],

        // ✅ Prevent Windows signal race
        handleSIGINT: false,
        handleSIGTERM: false,
        handleSIGHUP: false
      });

      const page = await browser.newPage();

      const htmlContent = `
      <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0;
              padding: 20px;
              color: #333;
            }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { height: 80px; margin-bottom: 15px; }
            .report-title { font-size: 24px; font-weight: bold; }
            .data-table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #ddd;
            }
            .data-table th, .data-table td {
              border: 1px solid #ddd;
              padding: 10px;
            }
            .data-table th { background: #f8f9fa; }
            .text-left { text-align: left; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .success-cell { color: #27ae60; font-weight: bold; }
            .warning-cell { color: #f39c12; font-weight: bold; }
            .danger-cell { color: #e74c3c; font-weight: bold; }
            .footer {
              margin-top: 30px;
              text-align: right;
              font-size: 12px;
              color: #7f8c8d;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img class="logo" src="${options.logoUrl || 'https://nalsuvai.com/assets/imgs/theme/logo.png'}">
            <h1 class="report-title">${options.title || 'Report'}</h1>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                ${options.columns
          .map(col => `<th class="text-${col.align || 'left'}">${col.header}</th>`)
          .join('')}
              </tr>
            </thead>
            <tbody>
              ${data
          .map(item => `
                  <tr>
                    ${options.columns.map(col => {
            let value = item[col.field];
            let cellClass = col.align ? `text-${col.align}` : '';

            switch (col.type) {
              case 'currency':
                value = `₹${Number(value).toLocaleString('en-IN')}`;
                break;
              case 'percentage':
                value = `${value}%`;
                break;
              case 'number':
                value = Number(value).toLocaleString('en-IN');
                break;
              case 'date':
                value = new Date(value).toLocaleDateString('en-IN');
                break;
              case 'time':
                value = new Date(value).toLocaleTimeString('en-IN');
                break;
            }

            if (col.highlight) {
              for (const rule of col.highlight) {
                if (rule.condition(item[col.field])) {
                  cellClass += ` ${rule.class}`;
                  break;
                }
              }
            }

            return `<td class="${cellClass}">${value ?? '-'}</td>`;
          }).join('')}
                  </tr>
                `)
          .join('')}
            </tbody>
          </table>

          <div class="footer">
            Generated on ${new Date().toLocaleString('en-IN')} | © 2025 Ramesh Traders
          </div>
        </body>
      </html>
    `;

      await page.setContent(htmlContent, { waitUntil: "networkidle0" });

      await page.pdf({
        path: filePath,
        format: 'A4',
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
      });

      return pdfUrl;

    } finally {
      if (browser) {
        await browser.close(); // ✅ guaranteed close
      }
    }
  }


  static async generateCSV(data: any[]): Promise<any> {
    try {
      const parser = new Parser();
      const csv = parser.parse(data);
      const filename = `sales-report-${Date.now()}.csv`;
      const filePath = path.join(__dirname, '../../public/reports', filename);

      fs.writeFileSync(filePath, csv);

      return {
        status: 'success',
        statusCode: StatusCodes.OK,
        message: 'CSV report generated successfully',
        data: {
          downloadUrl: `/reports/${filename}`
        }
      };
    } catch (err: any) {
      throw new Error('Failed to generate CSV');
    }
  }

  static async generateExcel(data: any[]): Promise<any> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sales Report');

      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        worksheet.columns = headers.map(header => ({
          header: header.toUpperCase().replace(/_/g, ' '),
          key: header,
          width: 20
        }));
      }

      worksheet.addRows(data);

      const reportsDir = path.join(__dirname, '../../public/reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const filename = `Report-${Date.now()}.xlsx`;
      const filePath = path.join(reportsDir, filename);

      await workbook.xlsx.writeFile(filePath);

      return {
        status: 'success',
        statusCode: StatusCodes.OK,
        message: 'Excel report generated successfully',
        data: {
          downloadUrl: `/reports/${filename}`,
          filename: filename
        }
      };
    } catch (err: any) {
      console.error('Excel generation error:', err);
      throw new Error(`Failed to generate Excel: ${err.message}`);
    }
  }
  static async generatePdfFromEjs(
    ejsFilePath: string,
    data: any,
    outputFilePath: string
  ): Promise<string> {
    try {
      console.log(ejsFilePath, "ejsFilePath");

      if (!fs.existsSync(ejsFilePath)) {
        throw new Error(`EJS file not found: ${ejsFilePath}`);
      }

      if (data.logoPath && fs.existsSync(data.logoPath)) {
        const logoExt = path.extname(data.logoPath).substring(1);
        const logoBase64 = fs.readFileSync(data.logoPath).toString("base64");
        data.logoBase64 = `data:image/${logoExt};base64,${logoBase64}`;
      }

      const htmlContent: any = await ejs.renderFile(ejsFilePath, data);

      const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();

      await page.setContent(htmlContent, { waitUntil: "networkidle0" });

      await page.pdf({
        path: outputFilePath,
        format: "A4",
        printBackground: true,
      });

      await browser.close();
      console.log(`✅ PDF generated at: ${outputFilePath}`);
      return outputFilePath;
    } catch (error: any) {
      console.error("❌ Error generating PDF:", error.message);
      throw error;
    }
  }

}