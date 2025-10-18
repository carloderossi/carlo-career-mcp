#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";
// Lazy load pdf-parse only when needed
let pdfParse = null;
async function getPdfParse() {
    if (!pdfParse) {
        const { createRequire } = await import('module');
        const require = createRequire(import.meta.url);
        pdfParse = require('pdf-parse');
    }
    return pdfParse;
}
// Configuration
const WATCHED_DIRECTORY = process.env.PDF_DIRECTORY || process.argv[2] || "C:\\Carlo\\Curriculum";
const ADZUNA_APP_ID = "a398784";
const ADZUNA_API_KEY = "e76f2cc0050ae1620b9eb66a33ff79d8";
// Server setup
const server = new Server({
    name: "carlo-career-mcp",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
        resources: {},
    },
});
// Helper: Get all PDF files recursively
async function getPDFFiles(dir) {
    const pdfFiles = [];
    async function scanDirectory(currentDir) {
        try {
            const entries = await fs.readdir(currentDir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(currentDir, entry.name);
                if (entry.isDirectory()) {
                    await scanDirectory(fullPath);
                }
                else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
                    pdfFiles.push(fullPath);
                }
            }
        }
        catch (error) {
            console.error(`Error scanning directory ${currentDir}:`, error);
        }
    }
    await scanDirectory(dir);
    return pdfFiles;
}
// Helper: Extract text from PDF
async function extractPDFText(filePath) {
    try {
        const pdf = await getPdfParse();
        const dataBuffer = await fs.readFile(filePath);
        const data = await pdf(dataBuffer);
        return data.text;
    }
    catch (error) {
        throw new Error(`Failed to extract PDF text: ${error}`);
    }
}
// Helper: Get PDF metadata
async function getPDFMetadata(filePath) {
    try {
        const pdf = await getPdfParse();
        const dataBuffer = await fs.readFile(filePath);
        const data = await pdf(dataBuffer);
        return {
            pages: data.numpages,
            info: data.info,
            metadata: data.metadata,
            version: data.version,
        };
    }
    catch (error) {
        throw new Error(`Failed to extract PDF metadata: ${error}`);
    }
}
// Helper: Search jobs via Adzuna API
async function searchJobs(query, location = "Zurich, Switzerland") {
    try {
        const url = `https://api.adzuna.com/v1/api/jobs/ch/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_API_KEY}&what=${encodeURIComponent(query)}&where=${encodeURIComponent(location)}&content-type=application/json`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Adzuna API error: ${response.status}`);
        }
        const data = await response.json();
        if (!data.results)
            return [];
        return data.results.map((job) => ({
            title: job.title,
            company: job.company?.display_name || "Unknown",
            location: job.location?.display_name || "",
            url: job.redirect_url,
            description: job.description?.slice(0, 300) + "...",
            salary: job.salary_min ? `CHF ${job.salary_min} - ${job.salary_max || 'N/A'}` : "Not specified",
            created: job.created
        }));
    }
    catch (error) {
        throw new Error(`Job search failed: ${error}`);
    }
}
// Helper: Answer questions from PDFs
async function answerQuestion(question) {
    const pdfFiles = await getPDFFiles(WATCHED_DIRECTORY);
    const matches = [];
    for (const file of pdfFiles) {
        try {
            const text = await extractPDFText(file);
            const lowerText = text.toLowerCase();
            const lowerQuestion = question.toLowerCase();
            if (lowerText.includes(lowerQuestion)) {
                const idx = lowerText.indexOf(lowerQuestion);
                const start = Math.max(0, idx - 100);
                const end = Math.min(text.length, idx + 200);
                const snippet = text.slice(start, end).replace(/\s+/g, ' ');
                matches.push({
                    file: path.basename(file),
                    snippet: snippet
                });
            }
        }
        catch (error) {
            console.error(`Error reading ${file}:`, error);
        }
    }
    if (matches.length === 0) {
        return `No relevant information found for "${question}" in your career documents.`;
    }
    return `Found ${matches.length} relevant document(s):\n\n` +
        matches.map(m => `📄 ${m.file}:\n${m.snippet}\n`).join('\n---\n');
}
// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    console.error("ListTools called");
    return {
        tools: [
            {
                name: "list_pdfs",
                description: "List all PDF files in Carlo's career documents directory",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "read_pdf",
                description: "Read and extract text content from a specific PDF file",
                inputSchema: {
                    type: "object",
                    properties: {
                        file_path: {
                            type: "string",
                            description: "Relative or absolute path to the PDF file",
                        },
                    },
                    required: ["file_path"],
                },
            },
            {
                name: "get_pdf_metadata",
                description: "Get metadata information about a PDF file (page count, author, etc.)",
                inputSchema: {
                    type: "object",
                    properties: {
                        file_path: {
                            type: "string",
                            description: "Relative or absolute path to the PDF file",
                        },
                    },
                    required: ["file_path"],
                },
            },
            {
                name: "search_pdfs",
                description: "Search for PDFs containing specific text in their filename",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "Search term to look for in PDF filenames",
                        },
                    },
                    required: ["query"],
                },
            },
            {
                name: "answer_career_question",
                description: "Answer questions about Carlo's career by searching through his documents",
                inputSchema: {
                    type: "object",
                    properties: {
                        question: {
                            type: "string",
                            description: "Question to answer from career documents",
                        },
                    },
                    required: ["question"],
                },
            },
            {
                name: "search_zurich_jobs",
                description: "Search for jobs in Zurich, Switzerland using Adzuna API",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "Job search query (e.g., 'software engineer', 'data scientist')",
                        },
                        location: {
                            type: "string",
                            description: "Location (default: Zurich, Switzerland)",
                        },
                    },
                    required: ["query"],
                },
            },
        ],
    };
});
// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    console.error(`Tool called: ${request.params.name}`);
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case "list_pdfs": {
                const pdfFiles = await getPDFFiles(WATCHED_DIRECTORY);
                const relativePaths = pdfFiles.map(f => path.relative(WATCHED_DIRECTORY, f));
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                directory: WATCHED_DIRECTORY,
                                count: pdfFiles.length,
                                files: relativePaths,
                            }, null, 2),
                        },
                    ],
                };
            }
            case "read_pdf": {
                const filePath = path.isAbsolute(args.file_path)
                    ? args.file_path
                    : path.join(WATCHED_DIRECTORY, args.file_path);
                const text = await extractPDFText(filePath);
                return {
                    content: [
                        {
                            type: "text",
                            text: `PDF Content from: ${path.basename(filePath)}\n\n${text}`,
                        },
                    ],
                };
            }
            case "get_pdf_metadata": {
                const filePath = path.isAbsolute(args.file_path)
                    ? args.file_path
                    : path.join(WATCHED_DIRECTORY, args.file_path);
                const metadata = await getPDFMetadata(filePath);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                file: path.basename(filePath),
                                ...metadata,
                            }, null, 2),
                        },
                    ],
                };
            }
            case "search_pdfs": {
                const pdfFiles = await getPDFFiles(WATCHED_DIRECTORY);
                const query = args.query.toLowerCase();
                const matches = pdfFiles.filter(f => path.basename(f).toLowerCase().includes(query));
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                query: args.query,
                                matches: matches.map(f => path.relative(WATCHED_DIRECTORY, f)),
                                count: matches.length,
                            }, null, 2),
                        },
                    ],
                };
            }
            case "answer_career_question": {
                const answer = await answerQuestion(args.question);
                return {
                    content: [
                        {
                            type: "text",
                            text: answer,
                        },
                    ],
                };
            }
            case "search_zurich_jobs": {
                const jobs = await searchJobs(args.query, args.location || "Zurich, Switzerland");
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                query: args.query,
                                location: args.location || "Zurich, Switzerland",
                                count: jobs.length,
                                jobs: jobs.slice(0, 10), // Limit to top 10
                            }, null, 2),
                        },
                    ],
                };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        console.error(`Tool error: ${error}`);
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
});
// List resources (expose PDFs as resources)
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    console.error("ListResources called");
    const pdfFiles = await getPDFFiles(WATCHED_DIRECTORY);
    return {
        resources: pdfFiles.map(filePath => ({
            uri: `pdf:///${path.relative(WATCHED_DIRECTORY, filePath)}`,
            name: path.basename(filePath),
            description: `PDF file: ${path.relative(WATCHED_DIRECTORY, filePath)}`,
            mimeType: "application/pdf",
        })),
    };
});
// Read resource
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    console.error(`ReadResource called for: ${request.params.uri}`);
    const uri = request.params.uri;
    if (!uri.startsWith("pdf:///")) {
        throw new Error("Invalid resource URI");
    }
    const relativePath = uri.slice(7); // Remove "pdf:///"
    const filePath = path.join(WATCHED_DIRECTORY, relativePath);
    const text = await extractPDFText(filePath);
    return {
        contents: [
            {
                uri,
                mimeType: "text/plain",
                text: text,
            },
        ],
    };
});
// Start server
async function main() {
    try {
        console.error(`Carlo Career MCP Server starting...`);
        console.error(`Node version: ${process.version}`);
        console.error(`Working directory: ${process.cwd()}`);
        console.error(`Watching directory: ${WATCHED_DIRECTORY}`);
        console.error(`Adzuna API configured for job search in Zurich`);
        const transport = new StdioServerTransport();
        // Handle uncaught errors
        process.on('uncaughtException', (error) => {
            console.error('Uncaught exception:', error);
        });
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled rejection at:', promise, 'reason:', reason);
        });
        await server.connect(transport);
        console.error("Carlo Career MCP Server connected and running");
    }
    catch (error) {
        console.error("Failed to start server:", error);
        console.error("Stack:", error instanceof Error ? error.stack : 'No stack');
        process.exit(1);
    }
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    console.error("Stack:", error instanceof Error ? error.stack : 'No stack');
    process.exit(1);
});
