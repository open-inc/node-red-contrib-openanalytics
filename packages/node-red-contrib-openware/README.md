# @openinc/node-red-contrib-openware

## Overview

`@openinc/node-red-contrib-openware` is a Node-RED package providing nodes to access the open.WARE Middleware by open.INC. It enables easy integration and manipulation of IoT timeseries data within the Node-RED environment.

## Features

- Access open.WARE Middleware
- Handle IoT timeseries data
- Nodes for configuration, data sources, items, subscription, and various data operations
- Convert CSV data to open.WARE format

## Installation

To install the package, run:

```sh
npm install @openinc/node-red-contrib-openware
```

## Nodes

### Configuration Nodes

- **openware-config**: Configuration node to connect to open.WARE Middleware.

### Functional Nodes

- **openware-sources**: Manage data sources.
- **openware-items**: Manage items within data sources.
- **openware-item-select**: Helper to create msg-parameters for history,aggregate & live node.
- **openware-subscription**: Subscribe to data changes.
- **openware-data-send**: Send data to open.WARE.
- **openware-data-live**: Retrieve live data.
- **openware-data-historical**: Retrieve historical data.
- **openware-data-aggregate**: Retrieve aggregated data.
- **openware-csv2ow**: Convert CSV data to open.WARE format.

## Get your own open.WARE Instance

Unlock the potential of your small or medium-sized enterprise with open.WARE MES, the cutting-edge IoT middleware from open.INC. Seamlessly integrate and manage your IoT timeseries data, optimize operations, and drive efficiency like never before.
Discover how open.WARE MES can transform your business.
Contact us at info@openinc.de to get a personalized quote and start your journey towards smarter manufacturing today!
