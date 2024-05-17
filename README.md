# @openinc/node-red-contrib-openanalytics

This Node-RED package contains nodes for working with machine learning models using the Ludwig library. It includes nodes for making predictions with trained models, training autoencoders, and training forecast models from time series data. It assumes that python [Ludwig](https://github.com/uber/ludwig) is installed and available as shell commands.

## Nodes

### ludwig-predict

This node is used to run predictions using models that have been previously trained. These can be selected on the settings of the node. It will start an endpoint for each model and call its api.

**Inputs:**

- `payload`: The input data for prediction, which is typically passed through the initial training node in `predict`-mode

**Outputs:**

- `payload`: The prediction results.

### ludwig-autoencoder

This node is used to train autoencoders from time series data.

**Inputs:**

- `payload`: The training data for the autoencoder.

**Outputs:**

- `payload`: Updates of the Training shell process.

### ludwig-forecast

This node is used to train forecast models from time series data.

**Inputs:**

- `payload`: The training data for the forecast model.

**Outputs:**

- `payload`: Updates of the Training shell process.

## Installation

To install this package, run the following command in your Node-RED user directory (typically `~/.node-red`):

```sh
npm install @openinc/node-red-contrib-openanalytics
```

## Usage

1. Drag the desired nodes from the palette to your flow.
2. Configure the nodes with the appropriate parameters.
3. Connect the nodes to other nodes as needed to build your flow.
4. Deploy your flow to start using the nodes.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your changes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

This project uses the Ludwig library for machine learning tasks. For more information about Ludwig, visit [Ludwig on GitHub](https://github.com/uber/ludwig).
