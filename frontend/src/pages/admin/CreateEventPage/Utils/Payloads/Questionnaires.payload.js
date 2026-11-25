export function buildQuestionnairesPayload(questionnaires = []) {
    return questionnaires.map((questionnaire) => ({
        ...(questionnaire.questionnaireId != null ? { questionnaireId: Number(questionnaire.questionnaireId) } : {}),

        title: questionnaire.title?.trim() || '',

        availableFrom: questionnaire.availableFrom || null,
        availableUntil: questionnaire.availableUntil || null,

        questions: (questionnaire.questions || []).map((question, index) => ({
            ...(question.questionId != null ? { questionId: Number(question.questionId) } : {}),

            text: question.text?.trim() || '',
            type: question.type,
            isRequired: Boolean(question.isRequired),
            sortOrder: index,

            options:
                question.type === 'text'
                    ? []
                    : (question.options || [])
                          .filter((option) => {
                              const text = typeof option === 'string' ? option : (option.text ?? option.optionText ?? '');

                              return text.trim().length > 0;
                          })
                          .map((option, optionIndex) => ({
                              ...(typeof option === 'object' && option.optionId != null ? { optionId: Number(option.optionId) } : {}),

                              text: typeof option === 'string' ? option.trim() : (option.text ?? option.optionText ?? '').trim(),

                              sortOrder: optionIndex,
                          })),
        })),
    }));
}
