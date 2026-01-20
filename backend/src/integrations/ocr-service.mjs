// backend/src/integrations/ocr-service.mjs
// OCR service for ID document scanning and data extraction

/**
 * OCR service for extracting data from ID documents
 * Supports passports, driver's licenses, national IDs
 */

class OCRService {
  constructor(config) {
    this.provider = config.provider || "mock";
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
  }

  /**
   * Extract data from ID document image
   * @param {Buffer|string} imageData - Image buffer or base64 string
   * @param {string} documentType - "passport", "drivers_license", "national_id"
   * @returns {Promise<Object>} Extracted data
   */
  async extractIDData(imageData, documentType = "passport") {
    switch (this.provider) {
      case "aws-textract":
        return this.extractWithTextract(imageData, documentType);
      case "google-vision":
        return this.extractWithGoogleVision(imageData, documentType);
      case "azure-vision":
        return this.extractWithAzureVision(imageData, documentType);
      case "mock":
        return this.extractMockData(documentType);
      default:
        throw new Error(`Unsupported OCR provider: ${this.provider}`);
    }
  }

  /**
   * Validate extracted ID data
   * @param {Object} data
   * @returns {Object} Validation result
   */
  validateIDData(data) {
    const errors = [];
    const warnings = [];

    // Required fields
    if (!data.documentNumber) errors.push("Document number is required");
    if (!data.firstName) errors.push("First name is required");
    if (!data.lastName) errors.push("Last name is required");
    if (!data.dateOfBirth) errors.push("Date of birth is required");
    if (!data.expiryDate) errors.push("Expiry date is required");

    // Date validations
    if (data.dateOfBirth) {
      const dob = new Date(data.dateOfBirth);
      const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      if (age < 18) warnings.push("Guest appears to be under 18");
      if (age > 120) errors.push("Invalid date of birth");
    }

    if (data.expiryDate) {
      const expiry = new Date(data.expiryDate);
      if (expiry < new Date()) {
        errors.push("Document has expired");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // AWS Textract implementation
  async extractWithTextract(imageData, documentType) {
    // In production, use AWS SDK
    // import { TextractClient, AnalyzeIDCommand } from "@aws-sdk/client-textract";
    
    const response = await fetch(`${this.baseUrl}/analyze-id`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": this.apiKey,
      },
      body: JSON.stringify({
        documentType,
        imageData: imageData.toString("base64"),
      }),
    });

    if (!response.ok) {
      throw new Error(`AWS Textract error: ${response.statusText}`);
    }

    const result = await response.json();
    return this.normalizeData(result, "textract");
  }

  // Google Vision API implementation
  async extractWithGoogleVision(imageData, documentType) {
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: imageData.toString("base64"),
              },
              features: [
                {
                  type: "DOCUMENT_TEXT_DETECTION",
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Google Vision error: ${response.statusText}`);
    }

    const result = await response.json();
    return this.normalizeData(result, "google-vision");
  }

  // Azure Computer Vision implementation
  async extractWithAzureVision(imageData, documentType) {
    const response = await fetch(`${this.baseUrl}/vision/v3.2/read/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "Ocp-Apim-Subscription-Key": this.apiKey,
      },
      body: imageData,
    });

    if (!response.ok) {
      throw new Error(`Azure Vision error: ${response.statusText}`);
    }

    const operationLocation = response.headers.get("Operation-Location");
    
    // Poll for result
    let result;
    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const resultResponse = await fetch(operationLocation, {
        headers: {
          "Ocp-Apim-Subscription-Key": this.apiKey,
        },
      });

      result = await resultResponse.json();
      if (result.status === "succeeded") break;
    }

    return this.normalizeData(result, "azure-vision");
  }

  // Mock implementation for testing
  extractMockData(documentType) {
    const mockData = {
      passport: {
        documentType: "passport",
        documentNumber: "P123456789",
        firstName: "John",
        lastName: "Doe",
        middleName: "Michael",
        dateOfBirth: "1985-06-15",
        nationality: "USA",
        sex: "M",
        issueDate: "2020-01-15",
        expiryDate: "2030-01-15",
        issuingCountry: "USA",
      },
      drivers_license: {
        documentType: "drivers_license",
        documentNumber: "DL987654321",
        firstName: "Jane",
        lastName: "Smith",
        dateOfBirth: "1990-03-22",
        address: "123 Main St, New York, NY 10001",
        sex: "F",
        issueDate: "2022-05-10",
        expiryDate: "2028-03-22",
        issuingState: "NY",
      },
      national_id: {
        documentType: "national_id",
        documentNumber: "ID555444333",
        firstName: "Carlos",
        lastName: "Rodriguez",
        dateOfBirth: "1988-11-30",
        nationality: "MEX",
        sex: "M",
        issueDate: "2021-08-20",
        expiryDate: "2031-08-20",
        issuingCountry: "MEX",
      },
    };

    return mockData[documentType] || mockData.passport;
  }

  // Normalize data from different providers
  normalizeData(rawData, provider) {
    // Transform provider-specific response to standard format
    return {
      documentType: rawData.documentType || "passport",
      documentNumber: rawData.documentNumber,
      firstName: rawData.firstName || rawData.given_name,
      lastName: rawData.lastName || rawData.family_name,
      middleName: rawData.middleName,
      dateOfBirth: rawData.dateOfBirth || rawData.birth_date,
      nationality: rawData.nationality,
      sex: rawData.sex || rawData.gender,
      issueDate: rawData.issueDate || rawData.issue_date,
      expiryDate: rawData.expiryDate || rawData.expiry_date,
      issuingCountry: rawData.issuingCountry || rawData.issuing_country,
      address: rawData.address,
      confidence: rawData.confidence || 0.95,
      provider,
      extractedAt: new Date().toISOString(),
    };
  }
}

export default OCRService;
