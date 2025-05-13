import app from "./app";
import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import OAuthProvider from "@cloudflare/workers-oauth-provider";

export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Demo",
		version: "1.0.0",
	});

	async init() {
		// Math operations
		this.server.tool("add", { a: z.number(), b: z.number() }, async ({ a, b }) => ({
			content: [{ type: "text", text: String(a + b) }],
		}));

		this.server.tool("multiply", { a: z.number(), b: z.number() }, async ({ a, b }) => ({
			content: [{ type: "text", text: String(a * b) }],
		}));

		// Weather tool with hardcoded data
		this.server.tool(
			"getWeather",
			{ location: z.string() },
			async ({ location }) => {
				const weatherData = {
					"New York": { temperature: "72°F", condition: "Sunny" },
					"London": { temperature: "62°F", condition: "Rainy" },
					"Tokyo": { temperature: "78°F", condition: "Cloudy" },
					"Sydney": { temperature: "82°F", condition: "Clear" },
				};

				const data = weatherData[location as keyof typeof weatherData] ||
					{ temperature: "70°F", condition: "Unknown" };

				return {
					content: [{
						type: "text",
						text: `Weather in ${location}: ${data.temperature}, ${data.condition}`
					}],
				};
			}
		);

		// User info tool
		this.server.tool("getUserProfile", {}, async () => ({
			content: [{
				type: "text",
				text: JSON.stringify({
					name: "Sample User",
					email: "user@example.com",
					preferences: {
						theme: "dark",
						notifications: true
					}
				}, null, 2)
			}]
		}));

		// Todo list tool
		this.server.tool(
			"getTodos",
			{},
			async () => ({
				content: [{
					type: "text",
					text: JSON.stringify([
						{ id: 1, title: "Finish project", completed: false },
						{ id: 2, title: "Buy groceries", completed: true },
						{ id: 3, title: "Call dentist", completed: false },
						{ id: 4, title: "Prepare presentation", completed: false }
					], null, 2)
				}]
			})
		);

		// Currency converter with predefined rates
		this.server.tool(
			"convertCurrency",
			{
				amount: z.number(),
				fromCurrency: z.string(),
				toCurrency: z.string()
			},
			async ({ amount, fromCurrency, toCurrency }) => {
				const rates = {
					"USD": { "EUR": 0.93, "GBP": 0.79, "JPY": 153.72, "CAD": 1.38 },
					"EUR": { "USD": 1.07, "GBP": 0.85, "JPY": 164.78, "CAD": 1.48 },
					"GBP": { "USD": 1.26, "EUR": 1.18, "JPY": 194.21, "CAD": 1.74 },
					"JPY": { "USD": 0.0065, "EUR": 0.0061, "GBP": 0.0052, "CAD": 0.0090 },
					"CAD": { "USD": 0.73, "EUR": 0.68, "GBP": 0.57, "JPY": 111.50 }
				};

				const from = fromCurrency.toUpperCase();
				const to = toCurrency.toUpperCase();

				// Check if currencies exist in our rates
				if (!rates[from as keyof typeof rates] || !rates[from as keyof typeof rates][to as keyof typeof rates[typeof from]]) {
					return {
						content: [{ type: "text", text: `Sorry, I don't have conversion data for ${fromCurrency} to ${toCurrency}.` }]
					};
				}

				const rate = rates[from as keyof typeof rates][to as keyof typeof rates[typeof from]];
				const converted = (amount * rate).toFixed(2);

				return {
					content: [{
						type: "text",
						text: `${amount} ${from} = ${converted} ${to}`
					}]
				};
			}
		);

		// Sentiment analyzer with predefined responses
		this.server.tool(
			"analyzeSentiment",
			{ text: z.string() },
			async ({ text }) => {
				let sentiment;
				const lowercaseText = text.toLowerCase();

				// Very simple keyword-based sentiment analysis
				if (
					lowercaseText.includes("great") ||
					lowercaseText.includes("happy") ||
					lowercaseText.includes("excellent") ||
					lowercaseText.includes("amazing")
				) {
					sentiment = "very positive";
				} else if (
					lowercaseText.includes("good") ||
					lowercaseText.includes("nice") ||
					lowercaseText.includes("like")
				) {
					sentiment = "positive";
				} else if (
					lowercaseText.includes("bad") ||
					lowercaseText.includes("poor") ||
					lowercaseText.includes("dislike")
				) {
					sentiment = "negative";
				} else if (
					lowercaseText.includes("terrible") ||
					lowercaseText.includes("awful") ||
					lowercaseText.includes("hate")
				) {
					sentiment = "very negative";
				} else {
					sentiment = "neutral";
				}

				return {
					content: [{
						type: "text",
						text: JSON.stringify({
							text,
							sentiment,
							confidence: 0.85
						}, null, 2)
					}]
				};
			}
		);

		// Document generator with templates
		this.server.tool(
			"generateDocument",
			{
				template: z.enum(["invoice", "report", "proposal", "letter"]),
				data: z.record(z.any())
			},
			async ({ template, data }) => {
				// Mock templates
				const templates = {
					invoice: {
						title: "INVOICE",
						fields: ["invoiceNumber", "date", "clientName", "items", "total"],
						generate: (data: any) => {
							const items = data.items || [];
							const itemsText = items.map((item: any) => 
								`- ${item.description}: $${item.amount.toFixed(2)}`
							).join("\n");
							
							return `
INVOICE #${data.invoiceNumber || "000000"}
Date: ${data.date || "2023-01-01"}
Client: ${data.clientName || "Client Name"}

Items:
${itemsText}

Total: $${data.total?.toFixed(2) || "0.00"}
`;
						}
					},
					report: {
						title: "REPORT",
						fields: ["title", "author", "date", "sections"],
						generate: (data: any) => {
							const sections = data.sections || [];
							const sectionsText = sections.map((section: any) => 
								`## ${section.title}\n\n${section.content}\n`
							).join("\n");
							
							return `
# ${data.title || "Untitled Report"}
Author: ${data.author || "Unknown"}
Date: ${data.date || "2023-01-01"}

${sectionsText}
`;
						}
					},
					proposal: {
						title: "BUSINESS PROPOSAL",
						fields: ["projectName", "client", "scope", "deliverables", "timeline", "budget"],
						generate: (data: any) => {
							const deliverables = data.deliverables || [];
							const deliverablesText = deliverables.map((item: string) => 
								`- ${item}`
							).join("\n");
							
							return `
# Business Proposal: ${data.projectName || "Untitled Project"}

## Client
${data.client || "Client Name"}

## Project Scope
${data.scope || "Project scope details..."}

## Deliverables
${deliverablesText}

## Timeline
${data.timeline || "Project timeline details..."}

## Budget
$${data.budget?.toFixed(2) || "0.00"}
`;
						}
					},
					letter: {
						title: "LETTER",
						fields: ["sender", "recipient", "date", "subject", "body", "closing"],
						generate: (data: any) => {
							return `
${data.sender || "Sender Name"}
${data.senderAddress || "Sender Address"}

${data.date || "2023-01-01"}

${data.recipient || "Recipient Name"}
${data.recipientAddress || "Recipient Address"}

Subject: ${data.subject || "No Subject"}

Dear ${data.recipient?.split(" ")[0] || "Sir/Madam"},

${data.body || "Letter body..."}

${data.closing || "Sincerely"},
${data.sender || "Sender"}
`;
						}
					}
				};
				
				// Get template or return error
				const selectedTemplate = templates[template];
				if (!selectedTemplate) {
					return {
						content: [{ 
							type: "text", 
							text: `Error: Template '${template}' not found.` 
						}]
					};
				}
				
				// Generate document
				const document = selectedTemplate.generate(data);
				
				return {
					content: [{ 
						type: "text", 
						text: document 
					}]
				};
			}
		);
	}
}

// Export the OAuth handler as the default
export default new OAuthProvider({
	apiRoute: "/sse",
	// TODO: fix these types
	// @ts-ignore
	apiHandler: MyMCP.mount("/sse"),
	// @ts-ignore
	defaultHandler: app,
	authorizeEndpoint: "/authorize",
	tokenEndpoint: "/token",
	clientRegistrationEndpoint: "/register",
});