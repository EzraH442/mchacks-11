import model


def train_model(params):
    m = model.DQNModel(config=params)
    m.train()
    return m
