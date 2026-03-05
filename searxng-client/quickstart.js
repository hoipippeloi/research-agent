#!/usr/bin/env node

/**
 * Quick Start Example for SearXNG API
 * 
 * This script demonstrates the simplest way to get started with the SearXNG API.
 */

const { SearXNGClient } = require('./searxng-client');

async function main() {
    // Initialize the client
    const client = new SearXNGClient();
    
    console.log('🚀 SearXNG API Quick Start');
    console.log('='.repeat(60));
    
    // Example 1: Simple search
    console.log('\n📝 Example 1: Simple Search');
    console.log('-'.repeat(60));
    try {
        const results = await client.searchGeneral('python requests library');
        console.log(`Found ${results.results.length} results`);
        if (results.results.length > 0) {
            console.log(`First result: ${results.results[0].title}`);
            console.log(`URL: ${results.results[0].url}`);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
    
    // Example 2: Code search
    console.log('\n💻 Example 2: Code Search');
    console.log('-'.repeat(60));
    try {
        const results = await client.searchCode('how to use async await in javascript');
        console.log(`Found ${results.results.length} code-related results`);
        if (results.results.length > 0) {
            console.log(`First result: ${results.results[0].title}`);
            console.log(`URL: ${results.results[0].url}`);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
    
    // Example 3: Academic search
    console.log('\n🎓 Example 3: Academic Search');
    console.log('-'.repeat(60));
    try {
        const results = await client.searchAcademic('transformer neural networks');
        console.log(`Found ${results.results.length} academic papers`);
        if (results.results.length > 0) {
            console.log(`First paper: ${results.results[0].title}`);
            console.log(`URL: ${results.results[0].url}`);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
    
    // Example 4: Custom search with specific engines
    console.log('\n🎯 Example 4: Custom Search');
    console.log('-'.repeat(60));
    try {
        const results = await client.search('machine learning tutorial', {
            engines: ['github', 'brave']
        });
        console.log(`Found ${results.results.length} results from GitHub and Brave`);
        if (results.results.length > 0) {
            console.log(`First result: ${results.results[0].title}`);
            console.log(`Engine: ${results.results[0].engine}`);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
    
    console.log('\n✅ Quick start complete!');
    console.log('\n💡 Next steps:');
    console.log('   - Import the client in your code: const { SearXNGClient } = require(\'./searxng-client\');');
    console.log('   - Check the README.md for detailed API documentation');
    console.log('   - Explore the available search engines and options');
    console.log('\n🌐 API Endpoint: https://searxng-production-b099.up.railway.app');
}

main().catch(console.error);
