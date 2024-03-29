import model


def train_model(params):
    m = model.DQNModel(config=params)
    m.train(save_plots=False)
    return m
