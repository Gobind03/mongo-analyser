# HOW TO INSTALL

1. Install Nodejs v16
2. Install  `pkg` package by running 
    
    ``` npm  -g i pkg```

2. Clone the repository and build binaries 


    ```
    $ git clone https://github.com/Gobind03/mongo-analyser.git

    $ cd mongo-analyser/

    $ npm install

    // Run this to building binaries for MacOS (Apple Chip)
    $ npm run build-mac-m1

    // Run this to building binaries for MacOS (Intel Chip)
    $ npm run build-mac-intel
    ```

3. Test successful compilation by running: 
    ```
    $ cd build/

    $ ./mongo-analyser-macos-arm64 --help
    ```



# Usage Guide
The tool has following modes: 

1. Profiler (Default): This would analyse the logs for slow operations and list them as independant line items with their basic analysis and inference done. 
2. Grouped (triggered by adding a `-g` flag in the cli): This would try to club queries by query patterns and normalise QTR, response times and even query plans for them. 

You will have to add a  `-f`  flag to point towards the log file that has to be analysed. Please note that the file path has to be relative to the folder in which binary is placed. 

You can also sort results by using the following flags: 
1.  `--sort-by-qtr`: Sorts the Data by QTR
2.  `--sort-by-duration`: Sorts the data by Execution time. In case of grouped data it is normalised QTR and normalised Execuiton time.

Note: In case both the flags are passed - Sorting by Duration takes precedence.