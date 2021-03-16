# WebCrawler

## Introduction
Simple WebCrawler that finds all links on a webpage and prints them out to the console.
Links on the webpage must have the following format to be considered valid ```<a href="http*">```.
Any links found on the explored webpage will be compared to a list of known links to avoid duplicate visits.
Multiple threads can be used to fetch and parse data from the provided URL.

## Libraries
Libraries included are:

- node.js (14.16.0 LTS) - Execute javascript code
- npm (6.14.11) - Use to install node modules
- node-worker-threads-pool - Access to creating pools of workers to request/parse HTML body for the main thread
- cheerio - HTML parser library to used to find all links on a webpage
- node-fetch - Use for fetching HTML data from provided URLs
- yargs - Command line arguement parser
- chai & mocha - To develop/run unit tests

## Installation
    1. Install Node.js and NPM from the Node.js official website
    2. Run npm install at the root level of directory to install all dependencies

## Usage
- A default run script is already setup and can be access with npm start

```
Default command line: node index.js -u https://github.com
```

However if a user would like to supply their own URL run this command line at the root directory:

```
node index.js -u <URL>
```

All command line options available are:
- -u - Link/URL to start crawling from
- -t - Timer to stop application (sec) (default: 300sec) (0 - run forever)
    
Example:

```
node index.js -u <URL> -t 120
```

## Test
Unit tests can be run with the following command at the root directory:

```
npm run test
```

## Future Considerations
This application currently runs without much consideration on physical constraints. Some physical constraints
could drastically change how this application was written and here are some notes to consider:

### CPU/Processor/Thread
Limited by the number of threads that can be created,  future improvement should allow users to choose whether to run
single threaded or multi-threaded.

### Memory 
The program keeps a running array to check against and overtime this array would
impact performance. To alleviate this issue, the program could write to storage (if provided) and access
the list of links with I/O operations. Such operations would take longer to complete but would 
allow for longer runs with less memory allocation.
    
### Storage
If non-volatile memory is not available, then the previous idea cannot be implemented. In
the case of limited storage and limited memory, the program would not keep a running list of unique URLs to 
compare against and would limit the max size of the array containing links for workers to request/parse. Once
the max size is reached, workers would have to wait for available space before sending their list of new URLs back 
to the main thread. However, this could create a hard stop on the application if all workers are waiting and none are
removing items off the list. In this situation, limiting the depth of how far a worker should go will alleviate a
wedge queue.