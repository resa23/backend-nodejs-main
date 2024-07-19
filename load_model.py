import sys
import pickle
import numpy as np

def load_model(filename, data):
    with open(filename, 'rb') as file:
        model = pickle.load(file)
    clusters = model.fit_predict(np.array(data))
    return clusters.tolist()

if __name__ == '__main__':
    filename = sys.argv[1]
    data = eval(sys.argv[2])  # This should be a list of data points
    clusters = load_model(filename, data)
    print(clusters)
