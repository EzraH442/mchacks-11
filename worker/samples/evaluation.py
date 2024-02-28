import model


def evaluate_model(model: model.DQNModel):
    return -1 * model.play(num_games=3)
