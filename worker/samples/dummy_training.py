import model


def train_model(params):
    m = model.DQNModel(config=params)
    return m
